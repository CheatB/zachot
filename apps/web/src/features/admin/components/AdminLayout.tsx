import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Container, Stack } from '@/ui';
import clsx from 'clsx';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="app-header__logo-icon" style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--color-neutral-100)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-neutral-0)',
            marginBottom: 'var(--spacing-16)'
          }}>
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 7.5L6 12.5L17 1.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-neutral-100)', margin: 0 }}>Админ-панель</h2>
        </div>
        <nav className="admin-nav">
          <ul className="admin-nav__list">
            <li>
              <NavLink 
                to="/admin/models" 
                className={({ isActive }) => clsx('admin-nav__link', isActive && 'admin-nav__link--active')}
              >
                🤖 Модели и роутинг
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
                📊 Аналитика P&L
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="admin-sidebar__footer">
          <button onClick={() => navigate('/')} className="admin-nav__link" style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}>
            🚪 Вернуться в сервис
          </button>
        </div>
      </aside>
      <main className="admin-content">
        <Container size="lg">
          <Stack gap="xl" style={{ paddingTop: 'var(--spacing-32)', paddingBottom: 'var(--spacing-80)' }}>
            <Outlet />
          </Stack>
        </Container>
      </main>

      <style>{`
        .admin-layout {
          display: flex;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-neutral-10);
          z-index: 9999;
        }
        .admin-sidebar {
          width: 280px;
          background-color: var(--color-surface-base);
          border-right: 1px solid var(--color-border-base);
          padding: var(--spacing-32) var(--spacing-24);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }
        .admin-sidebar__header {
          margin-bottom: var(--spacing-48);
        }
        .admin-nav {
          flex: 1;
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
          font-size: var(--font-size-base);
        }
        .admin-nav__link:hover {
          background-color: var(--color-neutral-10);
          color: var(--color-text-primary);
        }
        .admin-nav__link--active {
          background-color: var(--color-accent-light);
          color: var(--color-accent-base);
          font-weight: var(--font-weight-bold);
        }
        .admin-content {
          flex: 1;
          overflow-y: auto;
          height: 100vh;
        }
        .admin-sidebar__footer {
          margin-top: auto;
          padding-top: var(--spacing-24);
          border-top: 1px solid var(--color-border-light);
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;

