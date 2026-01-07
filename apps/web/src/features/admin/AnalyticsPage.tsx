/**
 * Admin AnalyticsPage
 * Dashboard with main KPIs
 */

import { Card, Stack } from '@/ui'

function AnalyticsPage() {
  const stats = [
    { label: 'Всего выручка', value: '499 000 ₽', color: 'var(--color-accent-base)' },
    { label: 'Затраты на OpenAI', value: '$460 (~43 700 ₽)', color: 'var(--color-danger-base)' },
    { label: 'Чистая прибыль (P&L)', value: '455 300 ₽', color: 'var(--color-accent-base)', bold: true },
    { label: 'Активных подписок', value: '1 000', color: 'var(--color-text-primary)' },
  ]

  return (
    <Stack gap="xl">
      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>Аналитика</h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Экономические показатели проекта в реальном времени
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-24)' }}>
        {stats.map((stat, i) => (
          <Card key={i} style={{ padding: 'var(--spacing-24)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-8)' }}>
              {stat.label}
            </div>
            <div style={{ 
              fontSize: stat.bold ? 'var(--font-size-2xl)' : 'var(--font-size-xl)', 
              fontWeight: 'bold', 
              color: stat.color 
            }}>
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <Card variant="default" style={{ padding: 'var(--spacing-24)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-16)' }}>Популярность типов работ</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          {[
            { name: 'Курсовая работа', percent: 65, color: '#16a34a' },
            { name: 'Реферат', percent: 20, color: '#2563eb' },
            { name: 'Решение задачи', percent: 10, color: '#f59e0b' },
            { name: 'Диплом', percent: 5, color: '#7c3aed' },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span>{item.name}</span>
                <span>{item.percent}%</span>
              </div>
              <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--color-neutral-10)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percent}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Stack>
  )
}

export default AnalyticsPage

