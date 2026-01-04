/**
 * Billing page placeholder
 * 
 * Заглушка страницы биллинга.
 */

import Link from 'next/link';

export default function BillingPage() {
  return (
    <div>
      <h1 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        marginBottom: 'var(--spacing-lg)',
        fontWeight: 'var(--font-weight-bold)'
      }}>
        Биллинг
      </h1>
      <p style={{ 
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        Страница биллинга (заглушка)
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


