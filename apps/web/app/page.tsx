/**
 * Landing page placeholder
 * 
 * Простая заглушка с ссылкой "Войти".
 * В будущем здесь будет полноценный лендинг.
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
      <h1 style={{ 
        fontSize: 'var(--font-size-3xl)', 
        marginBottom: 'var(--spacing-lg)',
        fontWeight: 'var(--font-weight-bold)'
      }}>
        Zachot
      </h1>
      <p style={{ 
        fontSize: 'var(--font-size-lg)', 
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        Система генераций образовательного продукта
      </p>
      <Link 
        href="/auth/login"
        style={{
          display: 'inline-block',
          padding: 'var(--spacing-md) var(--spacing-xl)',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          fontWeight: 'var(--font-weight-medium)',
          textDecoration: 'none',
        }}
      >
        Войти
      </Link>
    </div>
  );
}


