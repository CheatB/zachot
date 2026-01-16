import type { Meta, StoryObj } from '@storybook/react'
import Badge from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['neutral', 'success', 'warn', 'danger'],
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
    status: 'warn',
  },
}

export const Danger: Story = {
  args: {
    children: 'Ошибка',
    status: 'danger',
  },
}

export const Neutral: Story = {
  args: {
    children: 'По умолчанию',
    status: 'neutral',
  },
}
