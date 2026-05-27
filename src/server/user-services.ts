export interface UserService {
  icon: string;
  title: string;
  description: string;
  action: string;
}

export const userServices: UserService[] = [
  {
    icon: '🩹',
    title: 'Instant First Aid',
    description: 'Get immediate first aid guidance and connect with nearby medical responders.',
    action: 'Request Aid',
  },
  {
    icon: '🔧',
    title: 'Mechanic Service',
    description: 'Book certified mechanics for on-site repair, diagnostics, and roadside fixes.',
    action: 'Book Mechanic',
  },
  {
    icon: '🚓',
    title: 'Police Station Nearby',
    description: 'Locate and contact the nearest police station with one-tap emergency routing.',
    action: 'Find Station',
  },
  {
    icon: '🍔',
    title: 'Food Delivery',
    description: 'Order meals from nearby restaurants with live tracking and quick delivery.',
    action: 'Order Food',
  },
  {
    icon: '🚗',
    title: 'Towing Service',
    description: 'Request towing support for breakdowns, accidents, and vehicle relocation.',
    action: 'Request Tow',
  },
];
