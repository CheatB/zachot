"""
Автотесты для процесса генерации
"""

import pytest
import asyncio
from uuid import uuid4
from packages.core_domain import Generation, GenerationModule, GenerationStatus
from packages.ai_services.src.model_router import get_model_for_step
from packages.ai_services.src.prompt_manager import prompt_manager


class TestGenerationFlow:
    """Тесты процесса генерации"""
    
    def test_model_routing(self):
        """Тест маршрутизации моделей"""
        # Проверка для разных типов работ
        work_types = ['referat', 'kursach', 'essay', 'doklad', 'article', 'other']
        steps = ['structure', 'suggest_details', 'sources', 'generation', 'refine', 'editor']
        
        for work_type in work_types:
            for step in steps:
                model = get_model_for_step(step, work_type)
                assert model is not None, f"Model not found for {work_type}/{step}"
                assert isinstance(model, str), f"Model should be string for {work_type}/{step}"
                assert '/' in model, f"Model should contain provider/model for {work_type}/{step}"
    
    def test_prompts_exist(self):
        """Тест наличия всех промптов"""
        required_prompts = [
            'classifier',
            'suggest_details',
            'suggest_structure',
            'sources',
            'content',
            'generation',
            'humanize',
            'formatting',
            'qc',
            'editor_rewrite',
            'editor_shorter',
            'editor_longer',
            'editor_generate_chart',
            'editor_generate_table',
            'editor_custom'
        ]
        
        for prompt_key in required_prompts:
            prompt = prompt_manager.get_prompt(prompt_key)
            assert prompt is not None, f"Prompt not found: {prompt_key}"
    
    def test_generation_model_creation(self):
        """Тест создания модели Generation"""
        gen = Generation(
            id=uuid4(),
            user_id=uuid4(),
            module=GenerationModule.TEXT,
            work_type='referat',
            complexity_level='student',
            humanity_level='medium',
            input_payload={
                'topic': 'Test topic',
                'goal': 'Test goal',
                'idea': 'Test idea',
                'volume': 10
            },
            settings_payload={
                'structure': [],
                'sources': [],
                'formatting': {}
            },
            status=GenerationStatus.DRAFT
        )
        
        assert gen.id is not None
        assert gen.module == GenerationModule.TEXT
        assert gen.status == GenerationStatus.DRAFT
    
    def test_formatting_settings_validation(self):
        """Тест валидации настроек форматирования"""
        from src.features.create-generation.types import DEFAULT_GOST_FORMATTING
        
        # Проверка обязательных полей
        assert 'fontFamily' in DEFAULT_GOST_FORMATTING
        assert 'fontSize' in DEFAULT_GOST_FORMATTING
        assert 'lineSpacing' in DEFAULT_GOST_FORMATTING
        assert 'margins' in DEFAULT_GOST_FORMATTING
        assert 'headings' in DEFAULT_GOST_FORMATTING
        
        # Проверка значений по ГОСТ
        assert DEFAULT_GOST_FORMATTING['fontFamily'] == 'Times New Roman'
        assert DEFAULT_GOST_FORMATTING['fontSize'] == 14
        assert DEFAULT_GOST_FORMATTING['lineSpacing'] == 1.5
        assert DEFAULT_GOST_FORMATTING['margins']['left'] == 30
        assert DEFAULT_GOST_FORMATTING['margins']['right'] == 10
    
    def test_title_page_fields(self):
        """Тест полей титульного листа"""
        from src.features.create-generation.GenerationTitlePageStep import DEFAULT_TITLE_PAGE_DATA
        
        required_fields = [
            'universityName',
            'facultyName',
            'departmentName',
            'workType',
            'discipline',
            'theme',
            'studentName',
            'studentGroup',
            'supervisorName',
            'supervisorTitle',
            'city',
            'year'
        ]
        
        for field in required_fields:
            assert field in DEFAULT_TITLE_PAGE_DATA, f"Missing field: {field}"


class TestAIEditing:
    """Тесты AI-редактирования"""
    
    @pytest.mark.asyncio
    async def test_text_editor_service_import(self):
        """Тест импорта сервиса редактирования"""
        from packages.ai_services.src.text_editor import text_editor_service
        assert text_editor_service is not None
    
    def test_editor_prompts_structure(self):
        """Тест структуры промптов редактора"""
        editor_prompts = [
            'editor_rewrite',
            'editor_shorter',
            'editor_longer',
            'editor_generate_chart',
            'editor_generate_table',
            'editor_custom'
        ]
        
        for prompt_key in editor_prompts:
            prompt = prompt_manager.get_prompt(prompt_key)
            assert prompt is not None, f"Prompt not found: {prompt_key}"
            assert 'system' in prompt, f"Missing 'system' in {prompt_key}"
            assert 'user_template' in prompt, f"Missing 'user_template' in {prompt_key}"


class TestExportService:
    """Тесты сервиса экспорта"""
    
    def test_export_service_import(self):
        """Тест импорта сервиса экспорта"""
        from apps.api.services.export_service import export_service
        assert export_service is not None
    
    def test_export_formats(self):
        """Тест поддерживаемых форматов экспорта"""
        from apps.api.services.export_service import ExportService
        
        # Проверка наличия методов для всех форматов
        assert hasattr(ExportService, 'generate_docx')
        assert hasattr(ExportService, 'generate_pdf')
        assert hasattr(ExportService, 'generate_pptx')


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

