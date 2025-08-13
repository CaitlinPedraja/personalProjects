import type { Meta, StoryObj } from '@storybook/react';

import  FurnitureCard   from '../app/components/furniture-card';

const meta: Meta<typeof FurnitureCard> = {
  component: FurnitureCard,
  title: 'Components/FurnitureCard',
};

export default meta;
type Story = StoryObj<typeof FurnitureCard>;

export const Primary: Story = {
  args: {
    title: 'Light Grey Couch',
    price: '$100',
    imageUrl: 'https://via.placeholder.com/345x140'
  },
};
