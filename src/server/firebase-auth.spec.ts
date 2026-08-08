import { clearLoggedInEmail, getLoggedInEmail, setLoggedInEmail } from './firebase-auth';

describe('firebase auth state', () => {
  it('stores the authenticated email in the shared login state', () => {
    setLoggedInEmail('user@example.com');
    expect(getLoggedInEmail()).toBe('user@example.com');
  });

  it('clears the authenticated email when the user logs out', () => {
    setLoggedInEmail('user@example.com');
    clearLoggedInEmail();
    expect(getLoggedInEmail()).toBe('');
  });
});
