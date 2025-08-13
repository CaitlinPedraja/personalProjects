import type { Meta, StoryObj } from '@storybook/react';

import { ApartmentCard } from '../app/components/apartment-card';

const meta: Meta<typeof ApartmentCard> = {
  component: ApartmentCard,
  title: 'Components/ApartmentCard',
};

export default meta;
type Story = StoryObj<typeof ApartmentCard>;

export const Primary: Story = {
  args: {
    title: 'Luxury Apartment in NYC',
    address: '1234 Park Avenue, New York, NY',
    price: '$3,500/month',
    imageUrl: 'https://via.placeholder.com/345x140',
  },
};
