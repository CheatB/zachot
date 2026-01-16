import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info', 'default'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Success: Story = {
  args: {
    children: 'Успешно',
    status: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Ожидание',
    status: 'warning',
  },
}

export const Error: Story = {
  args: {
    children: 'Ошибка',
    status: 'error',
  },
}

export const Info: Story = {
  args: {
    children: 'Информация',
    status: 'info',
  },
}

export const Default: Story = {
  args: {
    children: 'По умолчанию',
    status: 'default',
  },
}
