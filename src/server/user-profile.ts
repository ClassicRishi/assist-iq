export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  memberSince: string;
  status: string;
  initials: string;
}

export const defaultUserProfile: UserProfile = {
  name: 'Rishi Kumar',
  email: 'rishi@assistiq.com',
  phone: '+91 98765 43210',
  location: 'New Delhi, India',
  memberSince: 'May 2026',
  status: 'Active',
  initials: 'RK',
};
