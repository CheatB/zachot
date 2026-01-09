/**
 * Admin UsersPage
 * Table of users, their subscriptions and activity
 */

import { Card, Stack } from '@/ui'

function UsersPage() {
  const mockUsers = [
    { id: '1', email: 'stud@vsu.ru', regDate: '01.01.2026', works: 12, spent: '$2.4', plan: 'Pro' },
    { id: '2', email: 'ivanov@hse.ru', regDate: '03.01.2026', works: 5, spent: '$0.8', plan: 'Base' },
    { id: '3', email: 'mash@mgu.ru', regDate: '05.01.2026', works: 45, spent: '$12.1', plan: 'Ultra' },
  ]

  return (
    <Stack gap="xl">
      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>Пользователи</h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Список всех зарегистрированных студентов и их активность
        </p>
      </div>

      <Card variant="default" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-neutral-10)', textAlign: 'left' }}>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--color-border-base)' }}>ID / Email</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--color-border-base)' }}>Дата рег.</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--color-border-base)' }}>Работ</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--color-border-base)' }}>Траты API</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--color-border-base)' }}>Тариф</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--color-neutral-10)' }}>
                <td style={{ padding: '16px' }}>{user.email}</td>
                <td style={{ padding: '16px' }}>{user.regDate}</td>
                <td style={{ padding: '16px' }}>{user.works}</td>
                <td style={{ padding: '16px', color: 'var(--color-danger-base)' }}>{user.spent}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: 'var(--radius-full)', 
                    backgroundColor: 'var(--color-accent-light)',
                    color: 'var(--color-accent-base)',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
                    {user.plan}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Stack>
  )
}

export default UsersPage

