import React, { useEffect, useState } from 'react';
import { Card, Stack, Button, Badge } from '@/ui';
import { fetchAdminGenerations, type AdminGenerationHistoryItem } from '@/shared/api/admin';

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
        <table className="admin-table-v2">
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
              // Группируем токены по моделям для краткого вывода
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

      {/* Modal Window */}
      {selectedGen && (
        <div className="admin-modal-overlay" onClick={() => setSelectedGen(null)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Детали генерации</h3>
              <button className="close-btn" onClick={() => setSelectedGen(null)}>✕</button>
            </div>
            
            <Stack gap="lg">
              <div className="detail-section">
                <label>Пользователь:</label>
                <span>{selectedGen.user_email}</span>
              </div>
              <div className="detail-section">
                <label>ID генерации:</label>
                <code style={{ fontSize: '12px' }}>{selectedGen.id}</code>
              </div>
              
              <div className="divider" />
              
              <h4>Экономика работы</h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Себестоимость</div>
                  <div className="stat-value">{selectedGen.total_cost_rub} ₽</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Доход (оценка)</div>
                  <div className="stat-value">{selectedGen.estimated_revenue_rub} ₽</div>
                </div>
                <div className="stat-card" style={{ borderLeft: '2px solid var(--color-success-base)' }}>
                  <div className="stat-label">Прибыль</div>
                  <div className="stat-value" style={{ color: 'var(--color-success-base)' }}>{selectedGen.estimated_profit_rub} ₽</div>
                </div>
              </div>

              <div className="divider" />

              <h4>Детализация токенов</h4>
              <table className="usage-details-table">
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

            <div className="admin-modal-footer">
              <Button variant="secondary" onClick={() => setSelectedGen(null)}>Закрыть</Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-table-v2 {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table-v2 th {
          padding: var(--spacing-16) var(--spacing-24);
          background-color: var(--color-neutral-10);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          border-bottom: 1px solid var(--color-border-base);
        }
        .admin-table-v2 td {
          padding: var(--spacing-16) var(--spacing-24);
          border-bottom: 1px solid var(--color-border-base);
        }
        .admin-table-v2 tr:hover td {
          background-color: var(--color-neutral-5);
        }

        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }
        .admin-modal-content {
          background: white;
          width: 100%;
          max-width: 700px;
          border-radius: var(--radius-xl);
          padding: 32px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          max-height: 90vh;
          overflow-y: auto;
        }
        .admin-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .admin-modal-header h3 { margin: 0; font-size: 20px; font-weight: 800; }
        .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--color-text-muted); }

        .detail-section { display: flex; gap: 12px; font-size: 14px; }
        .detail-section label { font-weight: bold; color: var(--color-text-muted); min-width: 120px; }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
        .stat-card { background: var(--color-neutral-5); padding: 16px; border-radius: 12px; }
        .stat-label { font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 4px; }
        .stat-value { font-size: 18px; font-weight: 800; }

        .usage-details-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .usage-details-table th { text-align: left; padding: 8px; border-bottom: 1px solid var(--color-border-light); color: var(--color-text-muted); }
        .usage-details-table td { padding: 8px; border-bottom: 1px solid var(--color-neutral-5); }

        .divider { height: 1px; background: var(--color-border-light); margin: 8px 0; }
        .admin-modal-footer { margin-top: 32px; display: flex; justify-content: flex-end; }
      `}</style>
    </Stack>
  );
};

export default AdminGenerationsPage;

