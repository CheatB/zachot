/**
 * Generation detail page placeholder
 * 
 * Заглушка страницы детального просмотра генерации.
 */

import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default function GenerationDetailPage({ params }: PageProps) {
  return (
    <div>
      <h1 style={{ 
        fontSize: 'var(--font-size-2xl)', 
        marginBottom: 'var(--spacing-lg)',
        fontWeight: 'var(--font-weight-bold)'
      }}>
        Генерация {params.id.slice(0, 8)}...
      </h1>
      <p style={{ 
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        Страница детального просмотра генерации (заглушка)
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


