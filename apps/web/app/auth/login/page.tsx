/**
 * Login page placeholder
 * 
 * Заглушка страницы входа.
 * Без реализации бизнес-логики аутентификации.
 */

import Link from 'next/link';

export default function LoginPage() {
  return (
    <div style={{ 
      padding: 'var(--spacing-xl)',
      maxWidth: '400px',
      margin: '0 auto',
    }}>
      <h1 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        marginBottom: 'var(--spacing-lg)',
        fontWeight: 'var(--font-weight-bold)'
      }}>
        Вход
      </h1>
      <p style={{ 
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        Страница входа (заглушка)
      </p>
      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        <Link 
          href="/app"
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'underline',
          }}
        >
          Перейти в приложение →
        </Link>
      </div>
    </div>
  );
}


