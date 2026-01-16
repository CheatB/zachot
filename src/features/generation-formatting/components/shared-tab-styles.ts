/**
 * Общие стили для всех вкладок форматирования
 * Централизованное управление стилями для единообразия
 */

export const sharedTabStyles = `
.formatting-tab {
  max-width: 800px;
  margin: 0 auto;
}

.tab-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: var(--spacing-32) 0 var(--spacing-16) 0;
  padding-bottom: var(--spacing-12);
  border-bottom: 2px solid var(--color-border-light);
}

.tab-section-title:first-child {
  margin-top: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px; /* ИСПРАВЛЕНО: минимум 20px между полями */
  margin-bottom: 20px;
}

.form-row--quad {
  grid-template-columns: repeat(4, 1fr);
  gap: 20px; /* ИСПРАВЛЕНО: минимум 20px между полями */
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  margin-bottom: var(--spacing-16);
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-neutral-90);
}

/* ИСПРАВЛЕНО: Унифицированные стили для всех полей ввода */
.form-select,
.form-input {
  width: 100%;
  height: 48px; /* ИСПРАВЛЕНО: одинаковая высота для всех полей */
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border-base);
  background: white;
  font-size: 14px; /* ИСПРАВЛЕНО: одинаковый шрифт */
  font-family: inherit;
  color: var(--color-text-primary);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: var(--color-accent-base);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-12);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: var(--spacing-16);
  background: var(--color-background-secondary);
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  background: var(--color-accent-light);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* ИСПРАВЛЕНО: Убрана зеленая линия, оставлен только фон */
.info-block {
  margin-top: var(--spacing-32);
  padding: var(--spacing-20);
  background: var(--color-background-secondary);
  border-radius: var(--radius-lg);
  position: relative;
}

.info-block__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: 0 0 var(--spacing-12) 0;
}

.info-block__list {
  margin: 0;
  padding-left: var(--spacing-20);
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.info-block__list li {
  margin-bottom: var(--spacing-8);
}

.example-block {
  margin-top: var(--spacing-24);
  padding: var(--spacing-20);
  background: var(--color-neutral-10);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-base);
}

/* ИСПРАВЛЕНО: Заголовок примера сдвинут на 10px вправо */
.example-block__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-neutral-100);
  margin: 0 0 var(--spacing-12) 0;
  padding-left: 10px; /* Сдвиг на 10px вправо */
}

.example-block__content {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.example-block__content p {
  margin: 0 0 var(--spacing-12) 0;
  padding-left: var(--spacing-16);
}

/* Специальные стили для вкладки "Заголовки" */
.heading-section {
  margin-bottom: var(--spacing-32);
}

.heading-section + .heading-section {
  margin-top: 40px; /* +20px к стандартному отступу между секциями заголовков */
}

.checkbox-group {
  display: flex;
  gap: var(--spacing-12);
  margin-bottom: 10px; /* Уменьшено на 10px от чекбоксов до поля выравнивания */
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-row--quad {
    grid-template-columns: 1fr 1fr;
  }
}
`
