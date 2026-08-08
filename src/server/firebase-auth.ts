export let LoginedEmail = '';

export function setLoggedInEmail(email: string): void {
  LoginedEmail = (email ?? '').trim();
}

export function getLoggedInEmail(): string {
  return LoginedEmail;
}

export function clearLoggedInEmail(): void {
  LoginedEmail = '';
}

type FirebaseAuthResult = {
  ok: boolean;
  email: string;
  message: string;
};

function normalizeEmail(email: string): string {
  return (email ?? '').trim().toLowerCase();
}

async function callFirebaseAuthApi(
  endpoint: 'signInWithPassword' | 'signUp',
  email: string,
  password: string,
): Promise<FirebaseAuthResult> {
  const normalizedEmail = normalizeEmail(email);
  const apiKey = process.env['FIREBASE_API_KEY'] ?? process.env['FIREBASE_WEB_API_KEY'];

  if (!apiKey) {
    setLoggedInEmail(normalizedEmail);
    return {
      ok: true,
      email: normalizedEmail,
      message: 'Firebase API key is not configured; using the local in-memory login session.',
    };
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        returnSecureToken: true,
      }),
    });

    const data = (await response.json()) as {
      email?: string;
      localId?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        ok: false,
        email: normalizedEmail,
        message: data.error?.message ?? 'Firebase authentication failed.',
      };
    }

    const resolvedEmail = (data.email ?? normalizedEmail).trim();
    setLoggedInEmail(resolvedEmail);

    return {
      ok: true,
      email: resolvedEmail,
      message: endpoint === 'signInWithPassword' ? 'Firebase login successful.' : 'Firebase registration successful.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firebase request failed.';
    return {
      ok: false,
      email: normalizedEmail,
      message,
    };
  }
}

export async function loginWithFirebase(email: string, password: string): Promise<FirebaseAuthResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password || !password.trim()) {
    return {
      ok: false,
      email: normalizedEmail,
      message: 'Email and password are required.',
    };
  }

  return callFirebaseAuthApi('signInWithPassword', normalizedEmail, password);
}

export async function registerWithFirebase(email: string, password: string): Promise<FirebaseAuthResult> {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password || !password.trim()) {
    return {
      ok: false,
      email: normalizedEmail,
      message: 'Email and password are required.',
    };
  }

  return callFirebaseAuthApi('signUp', normalizedEmail, password);
}
