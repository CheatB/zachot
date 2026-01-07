import React, { useEffect, useState } from 'react';
import { Card, Stack, Grid } from '@/ui';
import { fetchAdminAnalytics, type AdminAnalytics } from '@/shared/api/admin';

const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    fetchAdminAnalytics().then(setData);
  }, []);

  if (!data) return <div>Загрузка аналитики...</div>;

  const metrics = [
    { label: 'Выручка (₽)', value: data.revenueRub.toLocaleString(), trend: '+12%', positive: true },
    { label: 'Затраты API ($)', value: `$${data.apiCostsUsd}`, trend: '+5%', positive: false },
    { label: 'Чистая маржа', value: `${data.marginPercent}%`, trend: '+2%', positive: true },
    { label: 'Всего работ', value: data.totalJobs.toLocaleString(), trend: '+18%', positive: true },
  ];

  return (
    <Stack gap="xl">
      <header>
        <h1 style={{ color: 'var(--color-neutral-100)', marginBottom: 'var(--spacing-8)' }}>Аналитика и P&L</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Экономические показатели сервиса в реальном времени.</p>
      </header>

      <Grid cols={4} gap="lg">
        {metrics.map(m => (
          <Card key={m.label} style={{ padding: 'var(--spacing-24)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-neutral-100)' }}>{m.value}</div>
            <div style={{ 
              fontSize: 'var(--font-size-xs)', 
              color: m.positive ? 'var(--color-success-base)' : 'var(--color-danger-base)',
              marginTop: 8,
              fontWeight: 'bold'
            }}>
              {m.trend} за неделю
            </div>
          </Card>
        ))}
      </Grid>

      <Card style={{ padding: 'var(--spacing-32)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-24)' }}>Активность по дням</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
          {data.dailyStats.map(stat => (
            <div key={stat.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '100%', 
                backgroundColor: 'var(--color-accent-base)', 
                height: `${(stat.jobs / 100) * 100}%`,
                borderRadius: '4px 4px 0 0',
                minHeight: '4px'
              }} />
              <div style={{ fontSize: '8px', color: 'var(--color-text-muted)', transform: 'rotate(-45deg)', marginTop: '8px' }}>
                {stat.date.split('-').slice(1).join('.')}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Stack>
  );
};

export default AdminAnalyticsPage;

