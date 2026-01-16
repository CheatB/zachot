/**
 * ModelCostBreakdown - Распределение затрат по моделям
 */

import React from 'react';
import { AdminGenerationHistoryItem } from '@/shared/api/admin';

interface ModelCostBreakdownProps {
  generations: AdminGenerationHistoryItem[];
}

const ModelCostBreakdown: React.FC<ModelCostBreakdownProps> = ({ generations }) => {
  // Группируем затраты по моделям
  const modelCosts: Record<string, { tokens: number; cost: number; count: number }> = {};
  
  generations.forEach(gen => {
    gen.usage_metadata.forEach(usage => {
      const modelName = usage.model.split('/').pop() || usage.model;
      
      if (!modelCosts[modelName]) {
        modelCosts[modelName] = { tokens: 0, cost: 0, count: 0 };
      }
      
      modelCosts[modelName].tokens += usage.tokens;
      modelCosts[modelName].cost += usage.cost_usd * 95; // USD to RUB
      modelCosts[modelName].count += 1;
    });
  });
  
  // Сортируем по стоимости (от большей к меньшей)
  const sortedModels = Object.entries(modelCosts)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 10); // Топ-10 моделей
  
  const totalCost = sortedModels.reduce((sum, [, data]) => sum + data.cost, 0);
  
  // Цвета для разных моделей
  const colors = [
    'var(--color-primary-base)',
    'var(--color-accent-base)',
    'var(--color-success-base)',
    'var(--color-warn-base)',
    'var(--color-danger-base)',
    'var(--color-neutral-60)',
    'var(--color-primary-dark)',
    'var(--color-accent-dark)',
    'var(--color-success-dark)',
    'var(--color-warn-dark)',
  ];
  
  return (
    <div style={{ 
      padding: '24px', 
      background: 'var(--color-neutral-5)', 
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-neutral-20)'
    }}>
      <h3 style={{ marginBottom: '16px', color: 'var(--color-neutral-100)' }}>
        Распределение затрат по моделям
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedModels.map(([model, data], index) => {
          const percentage = totalCost > 0 ? (data.cost / totalCost) * 100 : 0;
          
          return (
            <div key={model} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '12px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontWeight: '600',
                  color: 'var(--color-neutral-100)'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    background: colors[index % colors.length]
                  }} />
                  {model}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '16px',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span>{data.cost.toFixed(2)} ₽</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {(data.tokens / 1000).toFixed(1)}k токенов
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {data.count} вызовов
                  </span>
                </div>
              </div>
              
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: 'var(--color-neutral-20)', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: colors[index % colors.length],
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              <div style={{ 
                fontSize: '10px', 
                color: 'var(--color-text-muted)',
                textAlign: 'right'
              }}>
                {percentage.toFixed(1)}% от общих затрат
              </div>
            </div>
          );
        })}
      </div>
      
      {sortedModels.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: 'var(--color-text-muted)' 
        }}>
          Нет данных о затратах
        </div>
      )}
      
      <div style={{ 
        marginTop: '24px', 
        paddingTop: '16px', 
        borderTop: '1px solid var(--color-neutral-20)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--color-neutral-100)'
      }}>
        <span>Итого:</span>
        <span>{totalCost.toFixed(2)} ₽</span>
      </div>
    </div>
  );
};

export default ModelCostBreakdown;
