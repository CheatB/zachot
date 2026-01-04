/**
 * Dashboard page placeholder
 * 
 * Заглушка главной страницы приложения.
 */

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        marginBottom: 'var(--spacing-lg)',
        fontWeight: 'var(--font-weight-bold)'
      }}>
        Dashboard
      </h1>
      <p style={{ 
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        Главная страница приложения (заглушка)
      </p>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
        <Link 
          href="/app/generation/new"
          style={{
            display: 'inline-block',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
          }}
        >
          Создать генерацию
        </Link>
        <Link 
          href="/app/billing"
          style={{
            display: 'inline-block',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid var(--color-border)`,
            textDecoration: 'none',
          }}
        >
          Биллинг
        </Link>
      </div>
    </div>
  );
}


