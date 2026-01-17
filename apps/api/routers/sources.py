import logging
import base64
from uuid import UUID
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form

from ..schemas import SearchMoreSourcesRequest, UploadFileSourceRequest
from ..database import User as UserDB
from ..dependencies import get_current_user
from ..storage import generation_store
from ..services.ai_suggestion_service import ai_suggestion_service
from ..services.file_parser_service import file_parser_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sources", tags=["sources"])


@router.post("/search-more")
async def search_more_sources(
    request: SearchMoreSourcesRequest,
    user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Поиск дополнительных источников для существующей генерации.
    Добавляет 3-5 новых источников к текущему списку.
    """
    try:
        # Получаем генерацию
        generation = generation_store.get(request.generation_id)
        if not generation:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        if generation.user_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Получаем текущие источники
        current_sources = generation.settings_payload.get("sources", [])
        
        # Запрашиваем новые источники через AI
        input_payload = generation.input_payload or {}
        new_sources_response = await ai_suggestion_service.suggest_sources(
            topic=input_payload.get("topic", ""),
            goal=input_payload.get("goal", ""),
            idea=input_payload.get("idea", ""),
            module=generation.module.value,
            work_type=generation.work_type or "other",
            complexity=generation.complexity_level or "student",
            humanity=generation.humanity_level or "medium",
            user_id=user.id
        )
        
        new_sources = new_sources_response.get("sources", [])
        
        # Фильтруем дубликаты (по URL или названию)
        existing_urls = {s.get("url") for s in current_sources if s.get("url")}
        existing_titles = {s.get("title") for s in current_sources if s.get("title")}
        
        filtered_new_sources = []
        for source in new_sources:
            if source.get("url") not in existing_urls and source.get("title") not in existing_titles:
                filtered_new_sources.append(source)
        
        # Берём только первые 3-5 новых источников
        additional_sources = filtered_new_sources[:5]
        
        if not additional_sources:
            return {
                "success": False,
                "message": "Не удалось найти новые уникальные источники",
                "sources": current_sources
            }
        
        # Объединяем с текущими источниками
        updated_sources = current_sources + additional_sources
        
        # Обновляем генерацию
        generation_store.update(
            request.generation_id,
            settings_payload={
                **generation.settings_payload,
                "sources": updated_sources
            }
        )
        
        logger.info(f"Added {len(additional_sources)} new sources to generation {request.generation_id}")
        
        return {
            "success": True,
            "message": f"Добавлено {len(additional_sources)} новых источников",
            "sources": updated_sources,
            "new_sources": additional_sources
        }
        
    except Exception as e:
        logger.error(f"Error searching more sources: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to search more sources: {str(e)}")


@router.post("/upload-file")
async def upload_file_source(
    generation_id: str = Form(...),
    file: UploadFile = File(...),
    user: UserDB = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Загрузка файла как источника.
    Поддерживает PDF, DOCX, TXT.
    """
    try:
        generation_uuid = UUID(generation_id)
        
        # Получаем генерацию и проверяем, что она принадлежит пользователю
        generation = generation_store.get(generation_uuid)
        if not generation:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        # Проверяем, что генерация принадлежит текущему пользователю
        if str(generation.user_id) != str(user.id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Читаем файл
        file_content = await file.read()
        file_name = file.filename or "uploaded_file"
        file_type = file_name.split(".")[-1].lower() if "." in file_name else "txt"
        
        # Парсим файл
        parsed_content = await file_parser_service.parse_file(
            file_content=file_content,
            file_name=file_name,
            file_type=file_type
        )
        
        if not parsed_content:
            raise HTTPException(status_code=400, detail="Failed to parse file content")
        
        # Создаём источник из файла
        file_source = {
            "title": f"Загруженный документ: {file_name}",
            "url": f"file://{file_name}",
            "description": f"Пользовательский документ, содержащий {len(parsed_content)} символов текста",
            "source_type": "uploaded_file",
            "content": parsed_content[:5000],  # Сохраняем первые 5000 символов для контекста
            "isUserUploaded": True
        }
        
        # Получаем текущие источники и добавляем новый
        current_sources = generation.settings_payload.get("sources", [])
        updated_sources = current_sources + [file_source]
        
        # Обновляем генерацию
        generation_store.update(
            generation_uuid,
            settings_payload={
                **generation.settings_payload,
                "sources": updated_sources
            }
        )
        
        logger.info(f"Uploaded file source '{file_name}' to generation {generation_id}")
        
        return {
            "success": True,
            "message": f"Файл '{file_name}' успешно добавлен как источник",
            "source": file_source,
            "sources": updated_sources
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid generation ID: {str(e)}")
    except Exception as e:
        logger.error(f"Error uploading file source: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

