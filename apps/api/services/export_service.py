import io
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from fpdf import FPDF
from pptx import Presentation
from pptx.util import Inches, Pt
from packages.core_domain import Generation

class ExportService:
    @staticmethod
    def generate_docx(generation: Generation, content: str) -> io.BytesIO:
        doc = Document()
        
        # --- Title Page (ГОСТ-титульник) ---
        p = doc.add_paragraph('МИНИСТЕРСТВО ОБРАЗОВАНИЯ И НАУКИ')
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p = doc.add_paragraph('ГОСУДАРСТВЕННОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ')
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        doc.add_paragraph('\n' * 5)
        
        module_name = generation.module.value.upper()
        work_type = (generation.work_type or 'РАБОТА').upper()
        p = doc.add_paragraph(f'{work_type} ПО ТЕМЕ:')
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        p = doc.add_paragraph(generation.title or 'Без названия')
        if p.runs:
            run = p.runs[0]
            run.bold = True
            run.font.size = Pt(16)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        doc.add_paragraph('\n' * 10)
        
        p = doc.add_paragraph('Выполнил: AI-ассистент "Зачёт"')
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p = doc.add_paragraph(f'ID пользователя: {generation.user_id}')
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        
        doc.add_page_break()
        
        # --- Main Content ---
        for part in content.split('\n\n'):
            if part.startswith('# '):
                doc.add_heading(part.replace('# ', ''), level=1)
            elif part.startswith('## '):
                doc.add_heading(part.replace('## ', ''), level=2)
            else:
                doc.add_paragraph(part)
        
        file_stream = io.BytesIO()
        doc.save(file_stream)
        file_stream.seek(0)
        return file_stream

    @staticmethod
    def generate_pdf(generation: Generation, content: str) -> io.BytesIO:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        
        pdf.cell(200, 10, txt="ЗАЧЁТ - РЕЗУЛЬТАТ ГЕНЕРАЦИИ", ln=True, align='C')
        pdf.ln(20)
        pdf.cell(200, 10, txt=f"Тема: {generation.title or 'Без названия'}", ln=True, align='C')
        pdf.ln(10)
        pdf.cell(200, 10, txt=f"Тип: {generation.module.value}", ln=True, align='C')
        pdf.ln(20)
        
        pdf.multi_cell(0, 10, txt=content)
        
        return io.BytesIO(pdf.output())

    @staticmethod
    def generate_pptx(generation: Generation, content: str) -> io.BytesIO:
        prs = Presentation()
        
        # --- Title Slide ---
        title_slide_layout = prs.slide_layouts[0]
        slide = prs.slides.add_slide(title_slide_layout)
        title = slide.shapes.title
        subtitle = slide.placeholders[1]
        
        title.text = generation.title or "Зачёт - Презентация"
        subtitle.text = f"Тип: {generation.module.value}\nСтиль: {generation.input_payload.get('presentation_style', 'academic')}"
        
        # --- Content Slides ---
        # Разбиваем контент на слайды по заголовкам ##
        sections = content.split('## ')
        for section in sections[1:]: # Пропускаем текст до первого заголовка
            lines = section.split('\n')
            slide_title_text = lines[0]
            slide_content_text = "\n".join(lines[1:]).strip()
            
            bullet_slide_layout = prs.slide_layouts[1]
            slide = prs.slides.add_slide(bullet_slide_layout)
            slide.shapes.title.text = slide_title_text
            
            body_shape = slide.placeholders[1]
            tf = body_shape.text_frame
            tf.text = slide_content_text
            
        file_stream = io.BytesIO()
        prs.save(file_stream)
        file_stream.seek(0)
        return file_stream

export_service = ExportService()
