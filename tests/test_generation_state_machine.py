"""
Unit-тесты для GenerationStateMachine.
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

from packages.core_domain import (
    Generation,
    GenerationStateMachine,
    InvalidGenerationTransitionError,
    GenerationModule,
    GenerationStatus,
)


class TestGenerationStateMachineCanTransition:
    """Тесты метода can_transition."""
    
    def test_draft_to_running_allowed(self):
        """DRAFT → RUNNING должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.DRAFT,
            GenerationStatus.RUNNING
        ) is True
    
    def test_draft_to_canceled_allowed(self):
        """DRAFT → CANCELED должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.DRAFT,
            GenerationStatus.CANCELED
        ) is True
    
    def test_running_to_waiting_user_allowed(self):
        """RUNNING → WAITING_USER должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.RUNNING,
            GenerationStatus.WAITING_USER
        ) is True
    
    def test_running_to_generated_allowed(self):
        """RUNNING → GENERATED должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.RUNNING,
            GenerationStatus.GENERATED
        ) is True
    
    def test_running_to_failed_allowed(self):
        """RUNNING → FAILED должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.RUNNING,
            GenerationStatus.FAILED
        ) is True
    
    def test_waiting_user_to_running_allowed(self):
        """WAITING_USER → RUNNING должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.WAITING_USER,
            GenerationStatus.RUNNING
        ) is True
    
    def test_generated_to_exported_allowed(self):
        """GENERATED → EXPORTED должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.GENERATED,
            GenerationStatus.EXPORTED
        ) is True
    
    def test_failed_to_running_allowed(self):
        """FAILED → RUNNING (retry) должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.FAILED,
            GenerationStatus.RUNNING
        ) is True
    
    def test_any_status_to_canceled_allowed(self):
        """Любой статус → CANCELED должен быть допустим."""
        for status in GenerationStatus:
            if status != GenerationStatus.CANCELED:
                assert GenerationStateMachine.can_transition(
                    status,
                    GenerationStatus.CANCELED
                ) is True
    
    def test_draft_to_generated_not_allowed(self):
        """DRAFT → GENERATED не должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.DRAFT,
            GenerationStatus.GENERATED
        ) is False
    
    def test_generated_to_running_not_allowed(self):
        """GENERATED → RUNNING не должен быть допустим."""
        assert GenerationStateMachine.can_transition(
            GenerationStatus.GENERATED,
            GenerationStatus.RUNNING
        ) is False
    
    def test_same_status_transition_allowed(self):
        """Переход в тот же статус допустим (idempotency)."""
        for status in GenerationStatus:
            assert GenerationStateMachine.can_transition(status, status) is True


class TestGenerationStateMachineTransition:
    """Тесты метода transition."""
    
    def test_draft_to_running_sets_started_at(self, sample_generation):
        """Переход DRAFT → RUNNING должен установить started_at."""
        assert sample_generation.started_at is None
        
        result = GenerationStateMachine.transition(
            sample_generation,
            GenerationStatus.RUNNING
        )
        
        assert result.status == GenerationStatus.RUNNING
        assert result.started_at is not None
        assert result.updated_at > sample_generation.updated_at
    
    def test_running_to_generated_sets_finished_at(self, sample_generation):
        """Переход RUNNING → GENERATED должен установить finished_at."""
        # Сначала переводим в RUNNING
        running = GenerationStateMachine.transition(
            sample_generation,
            GenerationStatus.RUNNING
        )
        assert running.finished_at is None
        
        # Затем в GENERATED
        generated = GenerationStateMachine.transition(
            running,
            GenerationStatus.GENERATED
        )
        
        assert generated.status == GenerationStatus.GENERATED
        assert generated.finished_at is not None
        assert generated.finished_at >= generated.started_at
    
    def test_running_to_failed_sets_finished_at(self, sample_generation):
        """Переход RUNNING → FAILED должен установить finished_at."""
        running = GenerationStateMachine.transition(
            sample_generation,
            GenerationStatus.RUNNING
        )
        
        failed = GenerationStateMachine.transition(
            running,
            GenerationStatus.FAILED
        )
        
        assert failed.status == GenerationStatus.FAILED
        assert failed.finished_at is not None
    
    def test_generated_to_exported(self, sample_generation):
        """Переход GENERATED → EXPORTED должен работать."""
        running = GenerationStateMachine.transition(
            sample_generation,
            GenerationStatus.RUNNING
        )
        generated = GenerationStateMachine.transition(
            running,
            GenerationStatus.GENERATED
        )
        
        exported = GenerationStateMachine.transition(
            generated,
            GenerationStatus.EXPORTED
        )
        
        assert exported.status == GenerationStatus.EXPORTED
        assert exported.finished_at is not None
    
    def test_running_to_waiting_user_and_back(self, sample_generation):
        """Переход RUNNING → WAITING_USER → RUNNING должен работать."""
        running = GenerationStateMachine.transition(
            sample_generation,
            GenerationStatus.RUNNING
        )
        
        waiting = GenerationStateMachine.transition(
            running,
            GenerationStatus.WAITING_USER
        )
        assert waiting.status == GenerationStatus.WAITING_USER
        
        back_to_running = GenerationStateMachine.transition(
            waiting,
            GenerationStatus.RUNNING
        )
        assert back_to_running.status == GenerationStatus.RUNNING
    
    def test_failed_to_running_resets_finished_at(self):
        """Retry из FAILED → RUNNING должен сбросить finished_at."""
        failed_gen = Generation(
            id=uuid4(),
            user_id=uuid4(),
            module=GenerationModule.TEXT,
            status=GenerationStatus.FAILED,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            started_at=datetime.now(),
            finished_at=datetime.now(),
        )
        
        assert failed_gen.finished_at is not None
        
        retry = GenerationStateMachine.transition(
            failed_gen,
            GenerationStatus.RUNNING
        )
        
        assert retry.status == GenerationStatus.RUNNING
        assert retry.finished_at is None
    
    def test_any_status_to_canceled(self, sample_generation):
        """Переход любого статуса → CANCELED должен работать."""
        running = GenerationStateMachine.transition(
            sample_generation,
            GenerationStatus.RUNNING
        )
        
        canceled = GenerationStateMachine.transition(
            running,
            GenerationStatus.CANCELED
        )
        
        assert canceled.status == GenerationStatus.CANCELED
        assert canceled.finished_at is not None
    
    def test_same_status_transition_updates_timestamp(self, sample_generation):
        """Переход в тот же статус должен обновить updated_at."""
        running = GenerationStateMachine.transition(
            sample_generation,
            GenerationStatus.RUNNING
        )
        old_updated_at = running.updated_at
        
        # Небольшая задержка для гарантии разницы во времени
        import time
        time.sleep(0.01)
        
        same_status = GenerationStateMachine.transition(
            running,
            GenerationStatus.RUNNING
        )
        
        assert same_status.status == GenerationStatus.RUNNING
        assert same_status.updated_at > old_updated_at
    
    def test_invalid_transition_raises_exception(self, sample_generation):
        """Недопустимый переход должен выбросить InvalidGenerationTransitionError."""
        generated = Generation(
            id=uuid4(),
            user_id=uuid4(),
            module=GenerationModule.TEXT,
            status=GenerationStatus.GENERATED,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            started_at=datetime.now(),
            finished_at=datetime.now(),
        )
        
        with pytest.raises(InvalidGenerationTransitionError) as exc_info:
            GenerationStateMachine.transition(
                generated,
                GenerationStatus.RUNNING
            )
        
        assert exc_info.value.from_status == GenerationStatus.GENERATED
        assert exc_info.value.to_status == GenerationStatus.RUNNING
    
    def test_timestamps_consistency(self, sample_generation):
        """Временные метки должны быть согласованы."""
        running = GenerationStateMachine.transition(
            sample_generation,
            GenerationStatus.RUNNING
        )
        
        generated = GenerationStateMachine.transition(
            running,
            GenerationStatus.GENERATED
        )
        
        assert generated.started_at is not None
        assert generated.finished_at is not None
        assert generated.finished_at >= generated.started_at
        assert generated.updated_at >= generated.created_at

