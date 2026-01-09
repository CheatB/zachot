import React from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Stack, Grid } from '@/ui';

interface ImageSuggestion {
  slideId: number;
  description: string;
  style: string;
}

interface VisualUpsellCardProps {
  suggestions: ImageSuggestion[];
  onApprove: () => void;
}

const VisualUpsellCard: React.FC<VisualUpsellCardProps> = ({ suggestions, onApprove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card style={{ 
        background: 'linear-gradient(135deg, var(--color-accent-light) 0%, #ffffff 100%)',
        border: '2px solid var(--color-accent-base)',
        padding: 'var(--spacing-32)'
      }}>
        <Stack gap="xl">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Stack gap="xs">
              <h3 style={{ color: 'var(--color-accent-dark)', margin: 0 }}>
                🎨 Сделать презентацию профессиональной?
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', maxWidth: '500px' }}>
                Я проанализировал вашу тему и подготовил идеи для уникальных AI-иллюстраций. 
                Это сделает слайды живыми и запоминающимися.
              </p>
            </Stack>
            <div style={{ 
              backgroundColor: 'var(--color-accent-base)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: 'var(--radius-full)',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px var(--color-accent-shadow)'
            }}>
              100 ₽
            </div>
          </div>

          <div className="upsell-preview-grid">
            <Grid cols={3} gap="md">
              {suggestions.slice(0, 3).map((s, i) => (
                <div key={i} className="upsell-item">
                  <div className="upsell-item__placeholder">
                    <span>🖼️ Слайд {s.slideId}</span>
                  </div>
                  <div className="upsell-item__desc">{s.description}</div>
                </div>
              ))}
            </Grid>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-12)' }}>
            <Button variant="primary" size="lg" onClick={onApprove} style={{ minWidth: '300px' }}>
              Сгенерировать {suggestions.length} иллюстраций
            </Button>
          </div>
        </Stack>
      </Card>

      <style>{`
        .upsell-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-8);
        }
        .upsell-item__placeholder {
          aspect-ratio: 16/9;
          background-color: var(--color-neutral-10);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: var(--color-text-muted);
          border: 1px dashed var(--color-border-base);
        }
        .upsell-item__desc {
          font-size: 10px;
          color: var(--color-text-secondary);
          line-height: 1.4;
          font-style: italic;
        }
      `}</style>
    </motion.div>
  );
};

export default VisualUpsellCard;


