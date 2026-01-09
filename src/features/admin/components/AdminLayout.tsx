import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Stack } from '@/ui';

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      <main className="admin-content">
        <Container size="full">
          <Stack gap="xl" style={{ paddingBottom: 'var(--spacing-80)' }}>
            <Outlet />
          </Stack>
        </Container>
      </main>

      <style>{`
        .admin-layout {
          display: flex;
          width: 100%;
        }
        .admin-content {
          flex: 1;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
