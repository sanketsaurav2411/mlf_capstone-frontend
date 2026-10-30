import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  passwordHash: string;
}

export const demoUsers: User[] = [
  {
    id: 'user-1',
    name: 'Demo User',
    email: 'demo@example.com',
    company: 'Acme Trade Logistics',
    passwordHash: bcrypt.hashSync('Demo@123', 10),
  },
  {
    id: 'user-2',
    name: 'Aarav Mehta',
    email: 'business@tariff.ai',
    company: 'Export Logistics Pvt Ltd',
    passwordHash: bcrypt.hashSync('password123', 10),
  },
];

export async function findUserByEmail(email: string): Promise<User | null> {
  return demoUsers.find((user) => user.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

export function getUserById(userId: string): User | null {
  return demoUsers.find((user) => user.id === userId) || null;
}

export function serializeUser(user: User | null) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company || 'Trade & Logistics',
  };
}
