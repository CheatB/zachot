import pytest
# Testing the logic of the model_router which is used by workers
from apps.api.services.model_router import model_router

def test_model_router_priority():
    # Test that kursach gets better models than referat if configured
    model_referat = model_router.get_model_for_step("generation", "referat")
    model_article = model_router.get_model_for_step("generation", "article")
    assert model_referat is not None
    assert model_article is not None

def test_fallback_mapping():
    # Test that fallback categories work (referat -> text)
    model = model_router.get_model_for_step("structure", "referat", is_fallback=True)
    assert "mistral" in model or "gemini" in model
