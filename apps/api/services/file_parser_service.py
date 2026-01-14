import logging
import io
from typing import Optional

logger = logging.getLogger(__name__)


class FileParserService:
    """Сервис для парсинга различных типов файлов."""
    
    async def parse_file(self, file_content: bytes, file_name: str, file_type: str) -> Optional[str]:
        """
        Парсит файл и возвращает текстовое содержимое.
        
        Args:
            file_content: Содержимое файла в байтах
            file_name: Имя файла
            file_type: Тип файла (pdf, docx, txt)
            
        Returns:
            Текстовое содержимое файла или None при ошибке
        """
        try:
            if file_type == "txt":
                return self._parse_txt(file_content)
            elif file_type == "pdf":
                return self._parse_pdf(file_content)
            elif file_type in ["docx", "doc"]:
                return self._parse_docx(file_content)
            else:
                logger.warning(f"Unsupported file type: {file_type}")
                return None
        except Exception as e:
            logger.error(f"Error parsing file {file_name}: {e}", exc_info=True)
            return None
    
    def _parse_txt(self, file_content: bytes) -> str:
        """Парсит текстовый файл."""
        try:
            # Пробуем разные кодировки
            for encoding in ['utf-8', 'cp1251', 'latin-1']:
                try:
                    return file_content.decode(encoding)
                except UnicodeDecodeError:
                    continue
            # Если ничего не сработало, используем errors='ignore'
            return file_content.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Error parsing TXT: {e}")
            raise
    
    def _parse_pdf(self, file_content: bytes) -> str:
        """Парсит PDF файл."""
        try:
            import PyPDF2
            
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text = []
            for page in pdf_reader.pages:
                text.append(page.extract_text())
            
            return "\n\n".join(text)
        except ImportError:
            logger.error("PyPDF2 not installed. Install with: pip install PyPDF2")
            raise Exception("PDF parsing not available. Please contact support.")
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            raise
    
    def _parse_docx(self, file_content: bytes) -> str:
        """Парсит DOCX файл."""
        try:
            import docx
            
            docx_file = io.BytesIO(file_content)
            doc = docx.Document(docx_file)
            
            text = []
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text.append(paragraph.text)
            
            return "\n\n".join(text)
        except ImportError:
            logger.error("python-docx not installed. Install with: pip install python-docx")
            raise Exception("DOCX parsing not available. Please contact support.")
        except Exception as e:
            logger.error(f"Error parsing DOCX: {e}")
            raise


# Singleton instance
file_parser_service = FileParserService()

