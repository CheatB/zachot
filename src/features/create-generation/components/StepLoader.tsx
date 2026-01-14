import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Stack, Card } from '@/ui';

export interface StepLoaderTask {
  id: string;
  label: string;
}

interface StepLoaderProps {
  title: string;
  tasks: StepLoaderTask[];
  onComplete?: () => void;
  duration?: number; // Искусственная длительность в мс, если нет внешнего триггера
}

const StepLoader: React.FC<StepLoaderProps> = ({ title, tasks, onComplete, duration }) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const taskInterval = duration 
      ? duration / tasks.length 
      : 1500; // По умолчанию 1.5 сек на таск, если не задано

    const interval = setInterval(() => {
      setCurrentTaskIndex((prev) => {
        if (prev < tasks.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, taskInterval);

    // Быстрый рост до 90%, затем медленный до 95%
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          // Быстрый рост: +2% каждые 100ms = 90% за 4.5 сек
          return Math.min(prev + 2, 90);
        } else if (prev < 95) {
          // Медленный рост: +0.5% каждые 100ms = 5% за 1 сек
          return Math.min(prev + 0.5, 95);
        } else {
          // Остановка на 95%, ждём внешнего сигнала
          return prev;
        }
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [tasks.length, duration, onComplete]);

  return (
    <div className="step-loader">
      <Card style={{ padding: 'var(--spacing-48)', border: 'none', boxShadow: 'var(--elevation-3)' }}>
        <Stack gap="xl">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Stack gap="sm">
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-neutral-100)', margin: 0 }}>
                {title}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {progress < 100 ? `Осталось примерно ${Math.ceil((100 - progress) / 10)} сек.` : 'Почти готово!'}
              </p>
            </Stack>
            <div style={{ 
              fontSize: 'var(--font-size-2xl)', 
              fontWeight: 'bold', 
              color: 'var(--color-accent-base)',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {progress}%
            </div>
          </div>

          <div className="step-loader__progress-track">
            <motion.div 
              className="step-loader__progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          <ul className="step-loader__tasks" style={{ marginTop: '20px' }}>
            {tasks.map((task, index) => {
              const isCompleted = index < currentTaskIndex || progress === 100;
              const isActive = index === currentTaskIndex;

              return (
                <motion.li 
                  key={task.id}
                  className="step-loader__task"
                  animate={{ 
                    opacity: isActive || isCompleted ? 1 : 0.3,
                    x: isActive ? 4 : 0
                  }}
                >
                  <div className={`step-loader__task-dot ${isCompleted ? 'step-loader__task-dot--completed' : ''}`}>
                    {isCompleted ? '✓' : ''}
                  </div>
                  <span style={{ 
                    fontSize: 'var(--font-size-base)', 
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)'
                  }}>
                    {task.label}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </Stack>
      </Card>

      <style>{`
        .step-loader {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        .step-loader__progress-track {
          width: 100%;
          height: 6px;
          background-color: var(--color-neutral-20);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .step-loader__progress-bar {
          height: 100%;
          background-color: var(--color-accent-base);
          border-radius: var(--radius-full);
        }
        .step-loader__tasks {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-16);
        }
        .step-loader__task {
          display: flex;
          align-items: center;
          gap: var(--spacing-16);
        }
        .step-loader__task-dot {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-full);
          border: 2px solid var(--color-neutral-30);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .step-loader__task-dot--completed {
          background-color: var(--color-accent-base);
          border-color: var(--color-accent-base);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default StepLoader;

