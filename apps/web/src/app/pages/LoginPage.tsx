/**
 * LoginPage
 * Страница входа (заглушка)
 */

import AppShell from '../layout/AppShell'
import { EmptyState } from '@/ui'

function LoginPage() {
  return (
    <AppShell>
      <EmptyState
        title="Вход через лэндинг"
        description="Для входа в продукт используйте лэндинг"
      />
    </AppShell>
  )
}

export default LoginPage


