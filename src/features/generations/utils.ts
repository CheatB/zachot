export const getStatusLabel = (s: string): string => {
  switch (s.toUpperCase()) {
    case 'COMPLETED':
    case 'GENERATED':
    case 'EXPORTED':
      return 'Завершено'
    case 'IN_PROGRESS':
    case 'PROCESSING':
      return 'В процессе'
    case 'FAILED':
      return 'Ошибка'
    case 'DRAFT':
      return 'Черновик'
    case 'PENDING':
      return 'В очереди'
    default:
      return s
  }
}

export const getStatusBadgeStatus = (s: string): 'success' | 'warn' | 'danger' | 'neutral' => {
  switch (s.toUpperCase()) {
    case 'COMPLETED':
    case 'GENERATED':
    case 'EXPORTED':
      return 'success'
    case 'IN_PROGRESS':
    case 'PROCESSING':
      return 'warn'
    case 'FAILED':
      return 'danger'
    case 'DRAFT':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export const getModuleLabel = (module: string): string => {
  switch (module.toUpperCase()) {
    case 'TEXT':
      return 'Текстовая работа'
    case 'PRESENTATION':
      return 'Презентация'
    case 'TASK':
      return 'Решение задачи'
    case 'GOST_FORMAT':
      return 'Оформление по ГОСТу'
    default:
      return module
  }
}

export const getActionHint = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'DRAFT':
      return 'Продолжить'
    case 'FAILED':
      return 'Повторить'
    case 'COMPLETED':
    case 'GENERATED':
    case 'EXPORTED':
      return 'Открыть'
    default:
      return 'Продолжить'
  }
}

export const getGenerationCost = (generation: any): string => {
  // If usage_metadata exists and has data, calculate real cost
  if (generation.usage_metadata && generation.usage_metadata.length > 0) {
    const totalCostRub = generation.usage_metadata.reduce((sum: number, item: any) => {
      // Convert USD to RUB (approximate rate: 1 USD = 95 RUB)
      const costRub = (item.cost_usd || 0) * 95
      return sum + costRub
    }, 0)
    
    if (totalCostRub > 0) {
      return totalCostRub.toFixed(2)
    }
  }
  
  // Fallback: estimate based on volume
  if (generation.input_payload?.volume) {
    return Math.ceil(generation.input_payload.volume / 10).toString()
  }
  
  return '1'
}

export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}


