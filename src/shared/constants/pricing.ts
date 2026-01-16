/**
 * Константы ценообразования
 */

/**
 * Курс доллара для расчета стоимости
 * Обновляется вручную при значительных изменениях курса
 * Должен совпадать с USD_TO_RUB_RATE в apps/api/config.py
 */
export const USD_TO_RUB_RATE = 95;

/**
 * Форматирование стоимости в рублях
 */
export const formatCostRub = (costUsd: number): string => {
  const costRub = costUsd * USD_TO_RUB_RATE;
  return `${costRub.toFixed(2)} ₽`;
};

/**
 * Форматирование стоимости в долларах
 */
export const formatCostUsd = (costUsd: number): string => {
  return `$${costUsd.toFixed(4)}`;
};

/**
 * Конвертация USD в RUB
 */
export const usdToRub = (costUsd: number): number => {
  return costUsd * USD_TO_RUB_RATE;
};
