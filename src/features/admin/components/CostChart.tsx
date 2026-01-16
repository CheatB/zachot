/**
 * CostChart - График себестоимости генераций
 */

import React from 'react';
import { AdminGenerationHistoryItem } from '@/shared/api/admin';

interface CostChartProps {
  generations: AdminGenerationHistoryItem[];
}

const CostChart: React.FC<CostChartProps> = ({ generations }) => {
  // Группируем генерации по дням и считаем суммарную себестоимость
  const dailyCosts: Record<string, { date: string; cost: number; count: number }> = {};
  
  generations.forEach(gen => {
    const date = new Date(gen.created_at).toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    if (!dailyCosts[date]) {
      dailyCosts[date] = { date, cost: 0, count: 0 };
    }
    
    dailyCosts[date].cost += gen.total_cost_rub;
    dailyCosts[date].count += 1;
  });
  
  // Сортируем по дате и берем последние 7 дней
  const sortedData = Object.values(dailyCosts)
    .sort((a, b) => {
      const [dayA, monthA] = a.date.split('.');
      const [dayB, monthB] = b.date.split('.');
      return new Date(2026, parseInt(monthA) - 1, parseInt(dayA)).getTime() - 
             new Date(2026, parseInt(monthB) - 1, parseInt(dayB)).getTime();
    })
    .slice(-7);
  
  // Находим максимальное значение для масштабирования
  const maxCost = Math.max(...sortedData.map(d => d.cost), 1);
  
  return (
    <div style={{ 
      padding: '24px', 
      background: 'var(--color-neutral-5)', 
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-neutral-20)'
    }}>
      <h3 style={{ marginBottom: '16px', color: 'var(--color-neutral-100)' }}>
        Себестоимость генераций за последние 7 дней
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px' }}>
        {sortedData.map((item, index) => {
          const height = (item.cost / maxCost) * 180;
          
          return (
            <div 
              key={index} 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{ 
                position: 'relative',
                width: '100%',
                height: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}>
                <div
                  style={{
                    width: '100%',
                    height: `${height}px`,
                    background: 'linear-gradient(180deg, var(--color-danger-base) 0%, var(--color-danger-dark) 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title={`${item.cost.toFixed(2)} ₽ (${item.count} генераций)`}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--color-neutral-100)',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.cost.toFixed(1)} ₽
                  </div>
                </div>
              </div>
              
              <div style={{ 
                fontSize: '11px', 
                color: 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                {item.date}
              </div>
              
              <div style={{ 
                fontSize: '10px', 
                color: 'var(--color-text-muted)',
                textAlign: 'center'
              }}>
                {item.count} шт
              </div>
            </div>
          );
        })}
      </div>
      
      {sortedData.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: 'var(--color-text-muted)' 
        }}>
          Нет данных за последние 7 дней
        </div>
      )}
    </div>
  );
};

export default CostChart;
