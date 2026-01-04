/**
 * App layout
 * 
 * Базовый layout для приложения.
 */

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: 'var(--spacing-md) var(--spacing-xl)',
        borderBottom: `1px solid var(--color-border)`,
        backgroundColor: 'var(--color-bg-secondary)',
      }}>
        <nav style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
          <a href="/app" style={{ fontWeight: 'var(--font-weight-semibold)' }}>
            Zachot
          </a>
          <a href="/app/generation/new">Новая генерация</a>
          <a href="/app/billing">Биллинг</a>
        </nav>
      </header>
      <main style={{ flex: 1, padding: 'var(--spacing-xl)' }}>
        {children}
      </main>
    </div>
  );
}


