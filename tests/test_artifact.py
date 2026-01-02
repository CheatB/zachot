"""
Unit-тесты для Artifact.
"""

import pytest
from datetime import datetime
from uuid import uuid4

from packages.core_domain import Artifact, ArtifactType


class TestArtifactCreation:
    """Тесты создания Artifact."""
    
    def test_create_artifact_with_minimal_fields(self):
        """Создание Artifact с минимальными полями должно работать."""
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type=ArtifactType.TEXT_DOC,
            content="Test content",
            created_at=datetime.now(),
        )
        
        assert artifact.artifact_type == ArtifactType.TEXT_DOC
        assert artifact.content == "Test content"
        assert artifact.version == 1  # default
        assert artifact.file_ref is None
    
    def test_create_artifact_with_all_fields(self):
        """Создание Artifact со всеми полями должно работать."""
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type=ArtifactType.SLIDES,
            version=2,
            content={"slides": [{"title": "Slide 1"}]},
            file_ref="/path/to/file.pdf",
            created_at=datetime.now(),
        )
        
        assert artifact.artifact_type == ArtifactType.SLIDES
        assert artifact.version == 2
        assert isinstance(artifact.content, dict)
        assert artifact.file_ref == "/path/to/file.pdf"
    
    def test_create_artifact_with_dict_content(self):
        """Создание Artifact с dict content должно работать."""
        content = {
            "text": "Generated text",
            "metadata": {"length": 100, "quality": 0.95}
        }
        
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type=ArtifactType.TEXT_DOC,
            content=content,
            created_at=datetime.now(),
        )
        
        assert isinstance(artifact.content, dict)
        assert artifact.content == content
    
    def test_create_artifact_with_string_content(self):
        """Создание Artifact со string content должно работать."""
        content = "Simple text content"
        
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type=ArtifactType.TEXT_DOC,
            content=content,
            created_at=datetime.now(),
        )
        
        assert isinstance(artifact.content, str)
        assert artifact.content == content
    
    def test_create_artifact_all_types(self):
        """Создание Artifact всех типов должно работать."""
        for artifact_type in ArtifactType:
            artifact = Artifact(
                id=uuid4(),
                generation_id=uuid4(),
                artifact_type=artifact_type,
                content="test",
                created_at=datetime.now(),
            )
            
            assert artifact.artifact_type == artifact_type


class TestArtifactValidation:
    """Тесты валидации Artifact."""
    
    def test_version_must_be_positive(self):
        """version должна быть >= 1."""
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError) as exc_info:
            Artifact(
                id=uuid4(),
                generation_id=uuid4(),
                artifact_type=ArtifactType.TEXT_DOC,
                version=0,
                content="test",
                created_at=datetime.now(),
            )
        
        # Pydantic выбрасывает ValidationError с информацией о поле
        error_str = str(exc_info.value)
        assert "version" in error_str
        assert "greater than or equal to 1" in error_str or ">= 1" in error_str
    
    def test_version_cannot_be_negative(self):
        """version не может быть отрицательной."""
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError) as exc_info:
            Artifact(
                id=uuid4(),
                generation_id=uuid4(),
                artifact_type=ArtifactType.TEXT_DOC,
                version=-1,
                content="test",
                created_at=datetime.now(),
            )
        
        # Pydantic выбрасывает ValidationError с информацией о поле
        error_str = str(exc_info.value)
        assert "version" in error_str
        assert "greater than or equal to 1" in error_str or ">= 1" in error_str
    
    def test_version_one_is_valid(self):
        """version = 1 должна быть валидной."""
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type=ArtifactType.TEXT_DOC,
            version=1,
            content="test",
            created_at=datetime.now(),
        )
        
        assert artifact.version == 1
    
    def test_version_greater_than_one_is_valid(self):
        """version > 1 должна быть валидной."""
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type=ArtifactType.TEXT_DOC,
            version=5,
            content="test",
            created_at=datetime.now(),
        )
        
        assert artifact.version == 5
    
    def test_artifact_type_validation(self):
        """artifact_type должен быть из enum."""
        # Строковое значение должно конвертироваться
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type="TEXT_DOC",  # строка
            content="test",
            created_at=datetime.now(),
        )
        
        assert artifact.artifact_type == ArtifactType.TEXT_DOC


class TestArtifactRepr:
    """Тесты строкового представления Artifact."""
    
    def test_repr_contains_important_fields(self):
        """__repr__ должен содержать важные поля."""
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type=ArtifactType.TEXT_DOC,
            version=1,
            content="Test content",
            created_at=datetime.now(),
        )
        
        repr_str = repr(artifact)
        
        assert "Artifact" in repr_str
        assert "TEXT_DOC" in repr_str
        assert "version=1" in repr_str or "version: 1" in repr_str
    
    def test_str_is_readable(self):
        """__str__ должен быть читаемым."""
        artifact = Artifact(
            id=uuid4(),
            generation_id=uuid4(),
            artifact_type=ArtifactType.SLIDES,
            version=2,
            content="test",
            created_at=datetime.now(),
        )
        
        str_repr = str(artifact)
        
        assert "Artifact" in str_repr
        assert "SLIDES" in str_repr
        assert "v2" in str_repr

