"""
Unit-тесты для StepLifecycle.
"""

import pytest
from datetime import datetime
from uuid import uuid4

from packages.core_domain import (
    Step,
    StepLifecycle,
    InvalidStepTransitionError,
    StepAlreadyFinishedError,
    calculate_input_hash,
    StepStatus,
)


class TestStepLifecycleStart:
    """Тесты метода start."""
    
    def test_start_from_pending_succeeds(self, sample_step_pending):
        """start из PENDING должен перевести в RUNNING и установить started_at."""
        assert sample_step_pending.status == StepStatus.PENDING
        assert sample_step_pending.started_at is None
        
        result = StepLifecycle.start(sample_step_pending)
        
        assert result.status == StepStatus.RUNNING
        assert result.started_at is not None
        assert result.id == sample_step_pending.id
    
    def test_start_from_running_fails(self, sample_step_running):
        """start из RUNNING должен выбросить InvalidStepTransitionError."""
        with pytest.raises(InvalidStepTransitionError) as exc_info:
            StepLifecycle.start(sample_step_running)
        
        assert exc_info.value.from_status == StepStatus.RUNNING
        assert exc_info.value.to_status == StepStatus.RUNNING
        assert exc_info.value.operation == "start"
    
    def test_start_from_finished_fails(self):
        """start из финального статуса должен выбросить StepAlreadyFinishedError."""
        finished_step = Step(
            id=uuid4(),
            generation_id=uuid4(),
            step_type="test",
            status=StepStatus.SUCCEEDED,
            input_payload={},
            input_hash="test",
            started_at=datetime.now(),
            finished_at=datetime.now(),
            output_payload={"result": "done"},
            progress=100,
        )
        
        with pytest.raises(StepAlreadyFinishedError) as exc_info:
            StepLifecycle.start(finished_step)
        
        assert exc_info.value.current_status == StepStatus.SUCCEEDED
        assert exc_info.value.operation == "start"


class TestStepLifecycleComplete:
    """Тесты метода complete."""
    
    def test_complete_from_running_succeeds(self, sample_step_running):
        """complete из RUNNING должен перевести в SUCCEEDED."""
        output = {"result": "success", "data": "test"}
        
        result = StepLifecycle.complete(sample_step_running, output)
        
        assert result.status == StepStatus.SUCCEEDED
        assert result.output_payload == output
        assert result.finished_at is not None
        assert result.progress == 100
    
    def test_complete_from_pending_fails(self, sample_step_pending):
        """complete из PENDING должен выбросить InvalidStepTransitionError."""
        with pytest.raises(InvalidStepTransitionError) as exc_info:
            StepLifecycle.complete(sample_step_pending, {"result": "test"})
        
        assert exc_info.value.from_status == StepStatus.PENDING
        assert exc_info.value.to_status == StepStatus.SUCCEEDED
        assert exc_info.value.operation == "complete"
    
    def test_complete_from_finished_fails(self):
        """complete из финального статуса должен выбросить StepAlreadyFinishedError."""
        finished_step = Step(
            id=uuid4(),
            generation_id=uuid4(),
            step_type="test",
            status=StepStatus.FAILED,
            input_payload={},
            input_hash="test",
            started_at=datetime.now(),
            finished_at=datetime.now(),
            error={"code": "error"},
        )
        
        with pytest.raises(StepAlreadyFinishedError) as exc_info:
            StepLifecycle.complete(finished_step, {"result": "test"})
        
        assert exc_info.value.current_status == StepStatus.FAILED
        assert exc_info.value.operation == "complete"


class TestStepLifecycleFail:
    """Тесты метода fail."""
    
    def test_fail_from_running_succeeds(self, sample_step_running):
        """fail из RUNNING должен перевести в FAILED."""
        error = {"code": "timeout", "message": "Operation timed out"}
        
        result = StepLifecycle.fail(sample_step_running, error)
        
        assert result.status == StepStatus.FAILED
        assert result.error == error
        assert result.finished_at is not None
    
    def test_fail_from_pending_fails(self, sample_step_pending):
        """fail из PENDING должен выбросить InvalidStepTransitionError."""
        with pytest.raises(InvalidStepTransitionError) as exc_info:
            StepLifecycle.fail(sample_step_pending, {"error": "test"})
        
        assert exc_info.value.from_status == StepStatus.PENDING
        assert exc_info.value.to_status == StepStatus.FAILED
        assert exc_info.value.operation == "fail"
    
    def test_fail_from_finished_fails(self):
        """fail из финального статуса должен выбросить StepAlreadyFinishedError."""
        finished_step = Step(
            id=uuid4(),
            generation_id=uuid4(),
            step_type="test",
            status=StepStatus.SUCCEEDED,
            input_payload={},
            input_hash="test",
            started_at=datetime.now(),
            finished_at=datetime.now(),
            output_payload={"result": "done"},
            progress=100,
        )
        
        with pytest.raises(StepAlreadyFinishedError) as exc_info:
            StepLifecycle.fail(finished_step, {"error": "test"})
        
        assert exc_info.value.current_status == StepStatus.SUCCEEDED
        assert exc_info.value.operation == "fail"


class TestStepLifecycleMarkNeedUser:
    """Тесты метода mark_need_user."""
    
    def test_mark_need_user_from_running_succeeds(self, sample_step_running):
        """mark_need_user из RUNNING должен перевести в NEED_USER."""
        reason = {"action": "approve", "reason": "Need confirmation"}
        
        result = StepLifecycle.mark_need_user(sample_step_running, reason)
        
        assert result.status == StepStatus.NEED_USER
        assert result.error == reason
    
    def test_mark_need_user_without_reason(self, sample_step_running):
        """mark_need_user без reason должен работать."""
        result = StepLifecycle.mark_need_user(sample_step_running, None)
        
        assert result.status == StepStatus.NEED_USER
        # error может быть None или не установлен
    
    def test_mark_need_user_from_pending_fails(self, sample_step_pending):
        """mark_need_user из PENDING должен выбросить InvalidStepTransitionError."""
        with pytest.raises(InvalidStepTransitionError) as exc_info:
            StepLifecycle.mark_need_user(sample_step_pending, {"reason": "test"})
        
        assert exc_info.value.from_status == StepStatus.PENDING
        assert exc_info.value.to_status == StepStatus.NEED_USER
        assert exc_info.value.operation == "mark_need_user"
    
    def test_mark_need_user_from_finished_fails(self):
        """mark_need_user из финального статуса должен выбросить StepAlreadyFinishedError."""
        finished_step = Step(
            id=uuid4(),
            generation_id=uuid4(),
            step_type="test",
            status=StepStatus.SKIPPED,
            input_payload={},
            input_hash="test",
            finished_at=datetime.now(),
        )
        
        with pytest.raises(StepAlreadyFinishedError) as exc_info:
            StepLifecycle.mark_need_user(finished_step, {"reason": "test"})
        
        assert exc_info.value.current_status == StepStatus.SKIPPED
        assert exc_info.value.operation == "mark_need_user"


class TestStepLifecycleSkip:
    """Тесты метода skip."""
    
    def test_skip_from_pending_succeeds(self, sample_step_pending):
        """skip из PENDING должен перевести в SKIPPED."""
        reason = "Not needed for this generation"
        
        result = StepLifecycle.skip(sample_step_pending, reason)
        
        assert result.status == StepStatus.SKIPPED
        assert result.finished_at is not None
        assert result.error == {"reason": reason}
    
    def test_skip_from_running_succeeds(self, sample_step_running):
        """skip из RUNNING должен перевести в SKIPPED."""
        reason = "Cancelled by user"
        
        result = StepLifecycle.skip(sample_step_running, reason)
        
        assert result.status == StepStatus.SKIPPED
        assert result.finished_at is not None
        assert result.error == {"reason": reason}
    
    def test_skip_without_reason(self, sample_step_pending):
        """skip без reason должен работать."""
        result = StepLifecycle.skip(sample_step_pending, None)
        
        assert result.status == StepStatus.SKIPPED
        assert result.finished_at is not None
    
    def test_skip_from_need_user_fails(self):
        """skip из NEED_USER должен выбросить InvalidStepTransitionError."""
        need_user_step = Step(
            id=uuid4(),
            generation_id=uuid4(),
            step_type="test",
            status=StepStatus.NEED_USER,
            input_payload={},
            input_hash="test",
        )
        
        with pytest.raises(InvalidStepTransitionError) as exc_info:
            StepLifecycle.skip(need_user_step, "test")
        
        assert exc_info.value.from_status == StepStatus.NEED_USER
        assert exc_info.value.to_status == StepStatus.SKIPPED
        assert exc_info.value.operation == "skip"
    
    def test_skip_from_finished_fails(self):
        """skip из финального статуса должен выбросить StepAlreadyFinishedError."""
        finished_step = Step(
            id=uuid4(),
            generation_id=uuid4(),
            step_type="test",
            status=StepStatus.SUCCEEDED,
            input_payload={},
            input_hash="test",
            started_at=datetime.now(),
            finished_at=datetime.now(),
            output_payload={"result": "done"},
            progress=100,
        )
        
        with pytest.raises(StepAlreadyFinishedError) as exc_info:
            StepLifecycle.skip(finished_step, "test")
        
        assert exc_info.value.current_status == StepStatus.SUCCEEDED
        assert exc_info.value.operation == "skip"


class TestStepLifecycleFullFlow:
    """Тесты полного жизненного цикла."""
    
    def test_start_to_complete_flow(self, sample_step_pending):
        """Полный flow: start → complete."""
        started = StepLifecycle.start(sample_step_pending)
        assert started.status == StepStatus.RUNNING
        
        completed = StepLifecycle.complete(started, {"result": "success"})
        assert completed.status == StepStatus.SUCCEEDED
        assert completed.progress == 100
    
    def test_start_to_fail_flow(self, sample_step_pending):
        """Полный flow: start → fail."""
        started = StepLifecycle.start(sample_step_pending)
        assert started.status == StepStatus.RUNNING
        
        failed = StepLifecycle.fail(started, {"error": "timeout"})
        assert failed.status == StepStatus.FAILED
        assert failed.error == {"error": "timeout"}
    
    def test_start_to_mark_need_user_flow(self, sample_step_pending):
        """Полный flow: start → mark_need_user."""
        started = StepLifecycle.start(sample_step_pending)
        assert started.status == StepStatus.RUNNING
        
        need_user = StepLifecycle.mark_need_user(started, {"action": "approve"})
        assert need_user.status == StepStatus.NEED_USER
    
    def test_idempotency_all_final_statuses(self):
        """Проверка идемпотентности для всех финальных статусов."""
        final_statuses = [
            StepStatus.SUCCEEDED,
            StepStatus.FAILED,
            StepStatus.SKIPPED,
        ]
        
        for status in final_statuses:
            if status == StepStatus.SUCCEEDED:
                step = Step(
                    id=uuid4(),
                    generation_id=uuid4(),
                    step_type="test",
                    status=status,
                    input_payload={},
                    input_hash="test",
                    started_at=datetime.now(),
                    finished_at=datetime.now(),
                    output_payload={"result": "done"},
                    progress=100,
                )
            elif status == StepStatus.FAILED:
                step = Step(
                    id=uuid4(),
                    generation_id=uuid4(),
                    step_type="test",
                    status=status,
                    input_payload={},
                    input_hash="test",
                    started_at=datetime.now(),
                    finished_at=datetime.now(),
                    error={"code": "error"},
                )
            else:  # SKIPPED
                step = Step(
                    id=uuid4(),
                    generation_id=uuid4(),
                    step_type="test",
                    status=status,
                    input_payload={},
                    input_hash="test",
                    finished_at=datetime.now(),
                )
            
            # Все операции должны выбросить StepAlreadyFinishedError
            with pytest.raises(StepAlreadyFinishedError):
                StepLifecycle.start(step)
            
            with pytest.raises(StepAlreadyFinishedError):
                StepLifecycle.complete(step, {"result": "test"})
            
            with pytest.raises(StepAlreadyFinishedError):
                StepLifecycle.fail(step, {"error": "test"})



