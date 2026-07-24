import { Router } from 'express';

export const authRouter = Router();

interface TaktUserResponse {
  id?: string;
  username?: string;
  email?: string;
  fullName?: string;
  profile?: {
    areaOfActuation?: string;
    role?: string;
    jobLevel?: string;
  };
}

interface TaktAuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInMs: number;
}

function toFrontendUser(user: TaktUserResponse, fallbackUsername: string, fallbackEmail?: string) {
  return {
    id: user.id || `usr-${fallbackUsername}`,
    username: user.username || fallbackUsername,
    name: user.fullName || user.username || fallbackUsername,
    email: user.email || fallbackEmail || '',
    role: user.profile?.role || 'Usuário Takt',
    level: user.profile?.jobLevel || 'MVP',
    areaOfActuation: user.profile?.areaOfActuation || '',
    weeklyTargetHours: 40,
  };
}

async function taktFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiBaseUrl = process.env.TAKT_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('TAKT_API_BASE_URL is not configured');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `TAKT API returned ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function loadUserInfo(accessToken: string, fallbackUsername: string, fallbackEmail?: string) {
  const user = await taktFetch<TaktUserResponse>('/auth/info', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return toFrontendUser(user, fallbackUsername, fallbackEmail);
}

authRouter.post('/login', async (req, res) => {
  const { username, email, password } = req.body;
  const login = username || email;

  if (!login || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  const auth = await taktFetch<TaktAuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: login, password }),
  });

  const user = await loadUserInfo(auth.accessToken, login, email);

  return res.json({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    accessTokenExpiresInMs: auth.accessTokenExpiresInMs,
    user,
  });
});

authRouter.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  await taktFetch<TaktUserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });

  const auth = await taktFetch<TaktAuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  const user = await loadUserInfo(auth.accessToken, username, email);

  return res.status(201).json({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    accessTokenExpiresInMs: auth.accessTokenExpiresInMs,
    user,
  });
});

authRouter.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(204).send();
  }

  await taktFetch<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  return res.status(204).send();
});
