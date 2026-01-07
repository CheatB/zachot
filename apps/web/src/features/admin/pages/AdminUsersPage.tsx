import React, { useEffect, useState } from 'react';
import { Card, Stack } from '@/ui';
import { fetchAdminUsers, updateUserRole, type AdminUser } from '@/shared/api/admin';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Вы действительно хотите изменить роль пользователя на ${newRole}?`)) return;
    
    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
    } catch (error) {
      alert('Ошибка при обновлении роли');
    }
  };

  if (isLoading) return <div>Загрузка пользователей...</div>;

  return (
    <Stack gap="xl">
      <header>
        <h1 style={{ color: 'var(--color-neutral-100)', marginBottom: 'var(--spacing-8)' }}>Пользователи</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Список зарегистрированных пользователей и их активность.</p>
      </header>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table-v2">
          <thead>
            <tr>
              <th>Email</th>
              <th>Роль</th>
              <th>Дата рег.</th>
              <th>Использовано</th>
              <th>Токены</th>
              <th>Подписка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ fontWeight: 'bold' }}>{user.email}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>ID: {user.id}</div>
                </td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    backgroundColor: user.role === 'admin' ? 'var(--color-accent-light)' : 'var(--color-neutral-10)',
                    color: user.role === 'admin' ? 'var(--color-accent-base)' : 'var(--color-text-secondary)'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ fontSize: 'var(--font-size-sm)' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>{user.generations_used} / {user.generations_limit}</div>
                </td>
                <td>
                  <div style={{ fontSize: 'var(--font-size-sm)' }}>{(user.tokens_used / 1000).toFixed(0)}k / {(user.tokens_limit / 1000).toFixed(0)}k</div>
                </td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    backgroundColor: user.subscription_status === 'active' ? 'var(--color-success-light)' : 'var(--color-neutral-20)',
                    color: user.subscription_status === 'active' ? 'var(--color-success-base)' : 'var(--color-text-muted)'
                  }}>
                    {user.subscription_status}
                  </span>
                </td>
                <td>
                  <button 
                    className="admin-action-btn"
                    onClick={() => handleRoleChange(user.id, user.role)}
                  >
                    {user.role === 'admin' ? 'Сделать юзером' : 'Сделать админом'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <style>{`
        .admin-table-v2 {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table-v2 th {
          padding: var(--spacing-16) var(--spacing-24);
          background-color: var(--color-neutral-10);
          color: var(--color-text-secondary);
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          border-bottom: 1px solid var(--color-border-base);
        }
        .admin-table-v2 td {
          padding: var(--spacing-16) var(--spacing-24);
          border-bottom: 1px solid var(--color-border-base);
        }
        .admin-action-btn {
          color: var(--color-accent-base);
          background: none;
          border: 1px solid var(--color-accent-base);
          padding: 4px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-weight: bold;
          font-size: 10px;
          transition: all 0.2s ease;
        }
        .admin-action-btn:hover {
          background-color: var(--color-accent-base);
          color: white;
        }
      `}</style>
    </Stack>
  );
};

export default AdminUsersPage;
