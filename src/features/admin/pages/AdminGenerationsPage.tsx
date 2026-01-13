import React, { useEffect, useState } from 'react';
import { Card, Stack, Button, Badge } from '@/ui';
import { fetchAdminGenerations, type AdminGenerationHistoryItem } from '@/shared/api/admin';
import styles from './AdminGenerationsPage.module.css';

const AdminGenerationsPage: React.FC = () => {
  const [generations, setGenerations] = useState<AdminGenerationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGen, setSelectedGen] = useState<AdminGenerationHistoryItem | null>(null);

  useEffect(() => {
    loadGenerations();
  }, []);

  const loadGenerations = async () => {
    try {
      const data = await fetchAdminGenerations();
      setGenerations(data);
    } catch (error) {
      console.error('Failed to load generations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Загрузка истории...</div>;

  return (
    <Stack gap="xl">
      <header>
        <h1 style={{ color: 'var(--color-neutral-100)', marginBottom: 'var(--spacing-8)' }}>История генераций</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Список всех работ, созданных пользователями, с детализацией затрат.</p>
      </header>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className={styles.adminTableV2}>
          <thead>
            <tr>
              <th>Название и Модуль</th>
              <th>Токены по моделям</th>
              <th>Дата</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {generations.map(gen => {
              const modelSummary: Record<string, number> = {};
              gen.usage_metadata.forEach(u => {
                const shortName = u.model.split('/').pop() || u.model;
                modelSummary[shortName] = (modelSummary[shortName] || 0) + u.tokens;
              });

              return (
                <tr key={gen.id} onClick={() => setSelectedGen(gen)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{gen.title || 'Без названия'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{gen.module} • {gen.user_email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {Object.entries(modelSummary).map(([model, tokens]) => (
                        <Badge key={model} status="neutral" style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {model}: {(tokens / 1000).toFixed(1)}k
                        </Badge>
                      ))}
                      {Object.keys(modelSummary).length === 0 && <span style={{ color: 'var(--color-text-disabled)', fontSize: '12px' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-sm)' }}>
                    {new Date(gen.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <Badge status={gen.status === 'COMPLETED' ? 'success' : gen.status === 'FAILED' ? 'danger' : 'warn'}>
                      {gen.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {selectedGen && (
        <div className={styles.adminModalOverlay} onClick={() => setSelectedGen(null)}>
          <div className={styles.adminModalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.adminModalHeader}>
              <h3>Детали генерации</h3>
              <button className={styles.closeBtn} onClick={() => setSelectedGen(null)}>✕</button>
            </div>
            
            <Stack gap="lg">
              <div className={styles.detailSection}>
                <label>Пользователь:</label>
                <span>{selectedGen.user_email}</span>
              </div>
              <div className={styles.detailSection}>
                <label>ID генерации:</label>
                <code style={{ fontSize: '12px' }}>{selectedGen.id}</code>
              </div>
              
              <div className={styles.divider} />
              
              <h4>Экономика работы</h4>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Себестоимость</div>
                  <div className={styles.statValue}>{selectedGen.total_cost_rub} ₽</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Доход (оценка)</div>
                  <div className={styles.statValue}>{selectedGen.estimated_revenue_rub} ₽</div>
                </div>
                <div className={styles.statCard} style={{ borderLeft: '2px solid var(--color-success-base)' }}>
                  <div className={styles.statLabel}>Прибыль</div>
                  <div className={styles.statValue} style={{ color: 'var(--color-success-base)' }}>{selectedGen.estimated_profit_rub} ₽</div>
                </div>
              </div>

              <div className={styles.divider} />

              <h4>Детализация токенов</h4>
              <table className={styles.usageDetailsTable}>
                <thead>
                  <tr>
                    <th>Этап</th>
                    <th>Модель</th>
                    <th>Токены</th>
                    <th>Стоимость ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGen.usage_metadata.map((u, i) => (
                    <tr key={i}>
                      <td>{u.stage}</td>
                      <td>{u.model}</td>
                      <td>{u.tokens.toLocaleString()}</td>
                      <td>${u.cost_usd.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Stack>

            <div className={styles.adminModalFooter}>
              <Button variant="secondary" onClick={() => setSelectedGen(null)}>Закрыть</Button>
            </div>
          </div>
        </div>
      )}
    </Stack>
  );
};

export default AdminGenerationsPage;
