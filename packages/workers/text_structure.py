import asyncio
import logging
import json
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .base import BaseWorker
from apps.api.storage import generation_store
from apps.api.services.openai_service import openai_service
from apps.api.services.prompt_service import prompt_service
from apps.api.services.model_router import model_router

logger = logging.getLogger(__name__)

class TextStructureWorker(BaseWorker):
    def can_handle(self, job: Job) -> bool:
        return job.type == JobType.TEXT_STRUCTURE
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Starting AI-powered pipeline for job {job.id}")
        
        generation = generation_store.get(job.generation_id)
        if not generation:
            raise ValueError(f"Generation {job.generation_id} not found")

        topic = job.input_payload.get("topic", "")
        
        # --- СЛОЙ 1 & 3: Защита от пустых запросов и болтовни ---
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # 1. Проверка на минимальный ввод
            if len(topic.strip()) < 5:
                error_msg = "Пожалуйста, введите тему работы для начала генерации."
                generation_store.update(job.generation_id, result_content=error_msg, status="failed")
                return JobResult(job_id=job.id, success=False, output_payload={"reason": "empty"}, finished_at=datetime.now())

            # 2. Быстрая классификация (задача ли это?)
            classifier_prompt = prompt_service.construct_classifier_prompt(topic)
            raw_class = loop.run_until_complete(
                openai_service.chat_completion(
                    model="openai/gpt-4o-mini",
                    messages=[{"role": "user", "content": classifier_prompt}],
                    json_mode=True
                )
            )
            
            classification = json.loads(raw_class or '{"type": "task"}')
            if classification.get("type") == "chat":
                error_msg = "Этот раздел предназначен для создания академических работ. Пожалуйста, введите тему для реферата, статьи или курсовой."
                generation_store.update(job.generation_id, result_content=error_msg, status="failed")
                return JobResult(job_id=job.id, success=False, output_payload={"reason": "not_a_topic"}, finished_at=datetime.now())

            # --- ОСНОВНАЯ ЛОГИКА ГЕНЕРАЦИИ ---
            
            # 1. Генерация структуры (План), если её еще нет
            structure = generation.settings_payload.get("structure", [])
            if not structure:
                model_config = model_router.get_model_for_step("structure", generation.complexity_level)
                model_name = model_config["model"]
                prompt = prompt_service.construct_structure_prompt(generation)
                
                logger.info(f"Step 1: Generating structure using {model_name}")
                raw_response = loop.run_until_complete(
                    openai_service.chat_completion(model=model_name, messages=[{"role": "user", "content": prompt}], json_mode=True)
                )
                if not raw_response:
                    raise ValueError("Failed to get response from OpenAI for structure")
                structure_data = json.loads(raw_response)
                structure = structure_data.get("structure", [])
                generation_store.update(job.generation_id, settings_payload={**generation.settings_payload, "structure": structure})
                logger.info(f"Step 1: Structure generated with {len(structure)} sections")
            else:
                logger.info(f"Step 1: Using existing structure ({len(structure)} sections)")

            # 2. Подбор источников, если их еще нет
            sources = generation.settings_payload.get("sources", [])
            if not sources:
                logger.info("Step 2: Selecting sources...")
                sources_model = model_router.get_model_for_step("sources", generation.complexity_level)["model"]
                sources_prompt = prompt_service.construct_sources_prompt(generation)
                raw_sources = loop.run_until_complete(
                    openai_service.chat_completion(model=sources_model, messages=[{"role": "user", "content": sources_prompt}], json_mode=True)
                )
                if raw_sources:
                    sources_data = json.loads(raw_sources)
                    sources = sources_data.get("sources", [])
                    generation_store.update(job.generation_id, settings_payload={**generation.settings_payload, "sources": sources})
                    logger.info(f"Step 2: {len(sources)} sources found")
            else:
                logger.info(f"Step 2: Using existing sources ({len(sources)} sources)")

            # 3. Генерация текста (поглавно)
            logger.info("Step 3: Generating full text...")
            gen_model = model_router.get_model_for_step("draft", generation.complexity_level)["model"]
            
            # Собираем контекст из плана
            structure_titles = "\n".join([f"- {s.get('title')}" for s in structure])
            generation_prompt = prompt_service.construct_generation_prompt(
                generation, 
                section_title=f"Все разделы согласно плану:\n{structure_titles}",
                previous_context=""
            )
            
            raw_text = loop.run_until_complete(
                openai_service.chat_completion(model=gen_model, messages=[{"role": "user", "content": generation_prompt}])
            )
            
            if not raw_text:
                raise ValueError("Failed to generate content")
            full_text = raw_text
            
            # 4. Очеловечивание
            logger.info(f"Step 4: Humanizing text (level: {generation.humanity_level}%)...")
            refine_model = model_router.get_model_for_step("refine", generation.complexity_level)["model"]
            humanize_prompt = prompt_service.construct_humanize_prompt(full_text, generation.humanity_level)
            
            refined_text = loop.run_until_complete(
                openai_service.chat_completion(model=refine_model, messages=[{"role": "user", "content": humanize_prompt}])
            )
            
            # 5. Контроль качества (Layer 5: Quality Control)
            logger.info("Step 5: Quality Control check...")
            qc_text = refined_text or full_text
            qc_prompt = prompt_service.construct_qc_prompt(qc_text)
            
            final_content = loop.run_until_complete(
                openai_service.chat_completion(
                    model="openai/gpt-4o-mini",
                    messages=[{"role": "user", "content": qc_prompt}]
                )
            ) or qc_text
            
            # Финальное сохранение
            generation_store.update(job.generation_id, result_content=final_content, status="completed")
            logger.info("Pipeline completed successfully")

            return JobResult(
                job_id=job.id,
                success=True,
                output_payload={"status": "completed", "sections_count": len(structure)},
                finished_at=datetime.now(),
            )
            
        finally:
            loop.close()
