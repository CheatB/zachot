import React, { useEffect, useState } from 'react';
import { Card, Stack } from '@/ui';
import { fetchAdminUsers, type AdminUser } from '@/shared/api/admin';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminUsers().then(data => {
      setUsers(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div>Загрузка пользователей...</div>;

  return (
    <Stack gap="xl">
      <header>
        <h1 style={{ color: 'var(--color-neutral-100)', marginBottom: 'var(--spacing-8)' }}>Пользователи</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Список зарегистрированных пользователей и их активность.</p>
      </header>

      <Card>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Дата рег.</th>
              <th>Работ</th>
              <th>Токенов</th>
              <th>Подписка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.regDate}</td>
                <td>{user.jobsCount}</td>
                <td>{(user.tokensUsed / 1000).toFixed(0)}k</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    backgroundColor: user.subscriptionStatus === 'active' ? 'var(--color-success-light)' : 'var(--color-neutral-20)',
                    color: user.subscriptionStatus === 'active' ? 'var(--color-success-base)' : 'var(--color-text-muted)'
                  }}>
                    {user.subscriptionStatus}
                  </span>
                </td>
                <td>
                  <button className="admin-action-btn">Управлять</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <style>{`
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table th {
          padding: var(--spacing-16);
          background-color: var(--color-neutral-10);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          border-bottom: 1px solid var(--color-border-base);
        }
        .admin-table td {
          padding: var(--spacing-16);
          border-bottom: 1px solid var(--color-border-base);
          font-size: var(--font-size-sm);
        }
        .admin-action-btn {
          color: var(--color-accent-base);
          background: none;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-size: var(--font-size-xs);
        }
      `}</style>
    </Stack>
  );
};

export default AdminUsersPage;

