import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  // Get credentials from environment variables (Server-side only)
  // These should be set in Vercel Project Settings
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    return res.status(500).json({ error: 'Server misconfiguration: Credentials not set' });
  }

  if (username === adminUser && password === adminPass) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
}
