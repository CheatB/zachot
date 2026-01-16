import asyncio
import logging
import json
from datetime import datetime
from packages.jobs import Job, JobResult
from packages.jobs.enums import JobType
from .base import BaseWorker
from apps.api.storage import generation_store
from apps.api.services.openai_service import openai_service
from apps.api.services.model_router import model_router
from apps.api.services.prompt_service import prompt_service

logger = logging.getLogger(__name__)

class TextStructureWorker(BaseWorker):
    def can_handle(self, job: Job) -> bool:
        return job.type in [JobType.TEXT_STRUCTURE, JobType.PRESENTATION_STRUCTURE]
    
    def execute(self, job: Job) -> JobResult:
        logger.info(f"Starting AI-powered pipeline for job {job.id}, generation_id: {job.generation_id}")
        
        generation = generation_store.get(job.generation_id)
        if not generation:
            raise ValueError(f"Generation {job.generation_id} not found")

        topic = job.input_payload.get("topic", "")
        work_type = generation.work_type or "other"
        
        # Список для сбора метаданных об использовании AI
        usage_metadata = []
        
        # --- СЛОЙ 1 & 3: Защита от пустых запросов и болтовни ---
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Базовая проверка на минимальный ввод
            if len(topic.strip()) < 5:
                error_msg = "Пожалуйста, введите тему работы для начала генерации."
                generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
                return JobResult(
                    job_id=job.id, 
                    success=False, 
                    error={"code": "empty_topic", "message": error_msg}, 
                    finished_at=datetime.now()
                )
            
            # Семантическая валидация отключена для текстовых работ:
            # - Интерфейс требует прохождения 5 шагов (естественная защита от спама)
            # - Пользователь ограничен кредитами (биллинг защищает от абьюза)
            # - Если создана структура и источники - тема валидна
            # Классификатор остаётся только в TaskWorker для решения задач

            # --- ОСНОВНАЯ ЛОГИКА ГЕНЕРАЦИИ ---
            
            # 1. Генерация структуры (План), если её еще нет
            structure = generation.settings_payload.get("structure", [])
            if not structure:
                model_name = model_router.get_model_for_step("structure", work_type)
                prompt = prompt_service.construct_structure_prompt(generation)
                
                logger.info(f"Step 1: Generating structure using {model_name}")
                result = loop.run_until_complete(
                    openai_service.chat_completion(
                        model=model_name, 
                        messages=[{"role": "user", "content": prompt}], 
                        json_mode=True,
                        step_type="structure",
                        work_type=work_type,
                        return_usage=True
                    )
                )
                if not result or not result[0]:
                    raise ValueError("Failed to get response from OpenAI for structure")
                raw_response, usage_info = result
                usage_metadata.append({"stage": "structure", **usage_info})
                
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
                sources_model = model_router.get_model_for_step("sources", work_type)
                sources_prompt = prompt_service.construct_sources_prompt(generation)
                result = loop.run_until_complete(
                    openai_service.chat_completion(
                        model=sources_model, 
                        messages=[{"role": "user", "content": sources_prompt}], 
                        json_mode=True,
                        step_type="sources",
                        work_type=work_type,
                        return_usage=True
                    )
                )
                if result and result[0]:
                    raw_sources, usage_info = result
                    usage_metadata.append({"stage": "sources", **usage_info})
                    sources_data = json.loads(raw_sources)
                    sources = sources_data.get("sources", [])
                    generation_store.update(job.generation_id, settings_payload={**generation.settings_payload, "sources": sources})
                    logger.info(f"Step 2: {len(sources)} sources found")
            else:
                logger.info(f"Step 2: Using existing sources ({len(sources)} sources)")

            # 3. Генерация текста (поглавно для текстовых работ)
            logger.info("Step 3: Generating full text...")
            gen_model = model_router.get_model_for_step("generation", work_type)
            
            # Рассчитываем целевой объём
            target_volume = generation.input_payload.get('volume', 10)
            target_words = target_volume * 280
            
            # Для презентаций используем старую логику (один запрос)
            if generation.module.value == "PRESENTATION":
                logger.info(f"Presentation mode: generating all slides in one request...")
                structure_titles = "\n".join([f"- {s.get('title')}" for s in structure])
                generation_prompt = prompt_service.construct_generation_prompt(
                    generation, 
                    section_title=f"Все слайды согласно плану:\n{structure_titles}",
                    previous_context="",
                    sources=sources
                )
                
                result = loop.run_until_complete(
                    openai_service.chat_completion(
                        model=gen_model, 
                        messages=[{"role": "user", "content": generation_prompt}], 
                        json_mode=True,
                        step_type="generation",
                        work_type=work_type,
                        return_usage=True
                    )
                )
                
                if not result or not result[0]:
                    raise ValueError("Failed to generate content")
                raw_text, usage_info = result
                usage_metadata.append({"stage": "generation", **usage_info})
                logger.info(f"Raw text generated, length: {len(raw_text or '')}")
                
                # Парсим JSON и сохраняем метаданные
                try:
                    parsed_gen = json.loads(raw_text)
                    full_text = parsed_gen.get("content", "")
                    if parsed_gen.get("image_prompt"):
                        generation_store.update(job.generation_id, settings_payload={
                            **generation.settings_payload,
                            "visual_upsell_suggestions": [
                                {"slideId": 1, "description": parsed_gen.get("image_prompt"), "style": "AI Generated"}
                            ]
                        })
                except:
                    full_text = raw_text
            else:
                # Для текстовых работ: генерация по главам (атомарный подход)
                logger.info(f"Text mode: generating {len(structure)} sections separately...")
                logger.info(f"Target: {target_words} words total ({target_volume} pages)")
                
                # Рассчитываем целевой объём на одну главу
                words_per_section = target_words // len(structure) if len(structure) > 0 else target_words
                
                full_text_parts = []
                previous_context = ""
                
                for section_idx, section in enumerate(structure):
                    section_title = section.get('title', f'Раздел {section_idx + 1}')
                    section_level = section.get('level', 1)
                    
                    logger.info(f"Generating section {section_idx + 1}/{len(structure)}: '{section_title}' (level {section_level})")
                    
                    # Используем промпт "content" для генерации раздела
                    content_prompt = prompt_service.construct_content_prompt(
                        generation,
                        section_title=section_title,
                        previous_context=previous_context,
                        sources=sources,
                        target_words=words_per_section
                    )
                    
                    result = loop.run_until_complete(
                        openai_service.chat_completion(
                            model=gen_model,
                            messages=[{"role": "user", "content": content_prompt}],
                            json_mode=False,
                            step_type="content",  # Используем step_type "content"
                            work_type=work_type,
                            return_usage=True
                        )
                    )
                    
                    if result and result[0]:
                        section_text, usage_info = result
                        usage_metadata.append({"stage": "generation", **usage_info})
                        section_words = len(section_text.split())
                        logger.info(f"Section {section_idx + 1} generated: {section_words} words")
                        
                        # Форматируем заголовок в зависимости от уровня
                        if section_level == 1:
                            formatted_section = f"\n\n{section_title}\n\n{section_text}"
                        else:
                            formatted_section = f"\n\n{section_title}\n{section_text}"
                        
                        full_text_parts.append(formatted_section)
                        
                        # Сохраняем последние 500 символов как контекст для следующей главы
                        previous_context = section_text[-500:] if len(section_text) > 500 else section_text
                    else:
                        logger.warning(f"Section {section_idx + 1} generation failed, skipping")
                
                full_text = "\n".join(full_text_parts)
                logger.info(f"All sections combined: {len(full_text.split())} words total")
            
            logger.info(f"Full text prepared, length: {len(full_text or '')}")
            
            # 4. Контроль качества (Quality Control)
            logger.info("Step 4: Quality Control check...")
            qc_prompt = prompt_service.construct_qc_prompt(full_text)
            
            result = loop.run_until_complete(
                openai_service.chat_completion(
                    model="openai/gpt-4o-mini",
                    messages=[{"role": "user", "content": qc_prompt}],
                    return_usage=True
                )
            )
            
            if result and result[0]:
                final_content, usage_info = result
                usage_metadata.append({"stage": "qc", **usage_info})
            else:
                final_content = full_text
            
            logger.info(f"Final content after QC, length: {len(final_content or '')}")
            
            # Проверка объёма сгенерированного текста
            target_volume = generation.input_payload.get('volume', 10)
            target_words = target_volume * 280  # 280 слов на страницу
            actual_words = len(final_content.split()) if final_content else 0
            actual_chars = len(final_content) if final_content else 0
            
            volume_ratio = (actual_words / target_words * 100) if target_words > 0 else 0
            
            logger.info(
                f"Volume check: target={target_volume} pages ({target_words} words), "
                f"actual={actual_words} words ({actual_chars} chars), "
                f"ratio={volume_ratio:.1f}%"
            )
            
            if actual_words < target_words * 0.7:
                logger.warning(
                    f"⚠️ Generated text is significantly shorter than target! "
                    f"Expected: {target_words} words, Got: {actual_words} words ({volume_ratio:.1f}%)"
                )
            elif actual_words < target_words * 0.9:
                logger.info(
                    f"ℹ️ Generated text is slightly shorter than target: "
                    f"{actual_words}/{target_words} words ({volume_ratio:.1f}%)"
                )
            else:
                logger.info(
                    f"✅ Generated text meets volume requirements: "
                    f"{actual_words} words ({volume_ratio:.1f}% of target)"
                )
            
            # Финальное сохранение
            logger.info(f"Saving result_content to generation_id: {job.generation_id}, content length: {len(final_content or '')}")
            logger.info(f"Saving usage_metadata: {len(usage_metadata)} entries, total tokens: {sum(u.get('tokens', 0) for u in usage_metadata)}")
            generation_store.update(
                job.generation_id, 
                result_content=final_content, 
                status="GENERATED",
                usage_metadata=usage_metadata
            )
            logger.info("Pipeline completed successfully")

            return JobResult(
                job_id=job.id,
                success=True,
                output_payload={"status": "completed", "sections_count": len(structure)},
                finished_at=datetime.now(),
            )
        except Exception as e:
            logger.error(f"Error executing job {job.id}: {e}", exc_info=True)
            error_msg = f"Произошла ошибка при генерации: {str(e)}"
            generation_store.update(job.generation_id, result_content=error_msg, status="FAILED")
            return JobResult(
                job_id=job.id,
                success=False,
                error={"code": "execution_error", "message": str(e)},
                finished_at=datetime.now()
            )
        finally:
            loop.close()
