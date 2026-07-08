import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Simple mock login rule: any non-empty password is accepted
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  // Mock user details
  const mockUser = {
    id: 'usr-1001',
    name: 'Giovanna Freitas',
    email: email,
    role: 'Product Lead',
    level: 'Senior',
    weeklyTargetHours: 40,
  };

  const mockToken = 'mock-jwt-token-xyz-12345';

  return res.json({
    token: mockToken,
    user: mockUser,
  });
});
