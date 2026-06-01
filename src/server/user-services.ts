export interface UserService {
  icon: string;
  title: string;
  description: string;
  action: string;
  route: string;
}

export const userServices: UserService[] = [
  {
    icon: '🩹',
    title: 'Instant First Aid',
    description: 'Get immediate first aid guidance and connect with nearby medical responders.',
    action: 'Request Aid',
    route: '/first-aid'
  },
  {
    icon: '🔧',
    title: 'Mechanic Service',
    description: 'Book certified mechanics for on-site repair, diagnostics, and roadside fixes.',
    action: 'Book Mechanic',
    route: "/mechanic-service"
  },
  {
    icon: '🚓',
    title: 'Police Station Nearby',
    description: 'Locate and contact the nearest police station with one-tap emergency routing.',
    action: 'Find Station',
    route: '/police-stations'
  },
  {
    icon: '🍔',
    title: 'Food Delivery',
    description: 'Order meals from nearby restaurants with live tracking and quick delivery.',
    action: 'Order Food',
    route: "/food-delievery"
  }
];
