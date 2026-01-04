/**
 * New generation page placeholder
 * 
 * Заглушка страницы создания новой генерации.
 */

import Link from 'next/link';

export default function NewGenerationPage() {
  return (
    <div>
      <h1 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        marginBottom: 'var(--spacing-lg)',
        fontWeight: 'var(--font-weight-bold)'
      }}>
        Новая генерация
      </h1>
      <p style={{ 
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        Страница создания новой генерации (заглушка)
      </p>
      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <Link 
          href="/app"
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'underline',
          }}
        >
          ← Назад к dashboard
        </Link>
      </div>
    </div>
  );
}


