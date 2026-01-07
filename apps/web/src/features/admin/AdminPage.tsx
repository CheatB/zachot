/**
 * AdminPage layout
 * Base container for all admin features
 */

import { Link, Outlet, useLocation } from 'react-router-dom'
import { Container, Stack, Card } from '@/ui'

function AdminPage() {
  const location = useLocation()

  const navItems = [
    { label: '🤖 Модели', path: '/admin/models' },
    { label: '👥 Пользователи', path: '/admin/users' },
    { label: '📈 Аналитика', path: '/admin/analytics' },
  ]

  return (
    <Container size="lg">
      <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)' }}>
        <h1 style={{ color: 'var(--color-neutral-100)', fontSize: 'var(--font-size-2xl)' }}>
          Админ-панель
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--spacing-32)' }}>
          <aside>
            <Card variant="default" style={{ padding: 'var(--spacing-8)' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      padding: 'var(--spacing-12) var(--spacing-16)',
                      borderRadius: 'var(--radius-md)',
                      textDecoration: 'none',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      transition: 'all 0.2s ease',
                      backgroundColor: location.pathname === item.path ? 'var(--color-accent-light)' : 'transparent',
                      color: location.pathname === item.path ? 'var(--color-accent-base)' : 'var(--color-text-primary)',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </Card>
          </aside>

          <main>
            <Outlet />
          </main>
        </div>
      </Stack>
    </Container>
  )
}

export default AdminPage

