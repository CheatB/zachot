import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '20px' }}>
        <h3>Заголовок карточки</h3>
        <p>Это содержимое карточки с некоторым текстом.</p>
      </div>
    ),
  },
}

export const WithLongContent: Story = {
  args: {
    children: (
      <div style={{ padding: '20px' }}>
        <h3>Длинная карточка</h3>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
          nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
          eu fugiat nulla pariatur.
        </p>
      </div>
    ),
  },
}
