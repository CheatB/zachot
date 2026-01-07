import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Container, Stack } from '@/ui';
import clsx from 'clsx';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-neutral-100)' }}>Админ-панель</h2>
        </div>
        <nav className="admin-nav">
          <ul className="admin-nav__list">
            <li>
              <NavLink 
                to="/admin/models" 
                className={({ isActive }) => clsx('admin-nav__link', isActive && 'admin-nav__link--active')}
              >
                🤖 Управление моделями
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin/users" 
                className={({ isActive }) => clsx('admin-nav__link', isActive && 'admin-nav__link--active')}
              >
                👥 Пользователи
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin/analytics" 
                className={({ isActive }) => clsx('admin-nav__link', isActive && 'admin-nav__link--active')}
              >
                📊 Аналитика и P&L
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        <Container size="lg">
          <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-48)' }}>
            <Outlet />
          </Stack>
        </Container>
      </main>

      <style>{`
        .admin-layout {
          display: flex;
          min-height: calc(100vh - 64px);
          background-color: var(--color-neutral-10);
        }
        .admin-sidebar {
          width: 280px;
          background-color: var(--color-surface-base);
          border-right: 1px solid var(--color-border-base);
          padding: var(--spacing-24);
          flex-shrink: 0;
        }
        .admin-sidebar__header {
          margin-bottom: var(--spacing-32);
        }
        .admin-nav__list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-8);
        }
        .admin-nav__link {
          display: block;
          padding: var(--spacing-12) var(--spacing-16);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
          transition: all 0.2s ease;
        }
        .admin-nav__link:hover {
          background-color: var(--color-neutral-10);
          color: var(--color-text-primary);
        }
        .admin-nav__link--active {
          background-color: var(--color-accent-light);
          color: var(--color-accent-base);
        }
        .admin-content {
          flex: 1;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;

