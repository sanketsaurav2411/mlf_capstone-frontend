import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  passwordHash: string;
  avatar?: string;
  provider?: 'local' | 'google';
}

export const demoUsers: User[] = [
  {
    id: 'user-1',
    name: 'Demo User',
    email: 'demo@example.com',
    company: 'Acme Trade Logistics',
    passwordHash: bcrypt.hashSync('Demo@123', 10),
    provider: 'local',
  },
  {
    id: 'user-2',
    name: 'Aarav Mehta',
    email: 'business@tariff.ai',
    company: 'Export Logistics Pvt Ltd',
    passwordHash: bcrypt.hashSync('password123', 10),
    provider: 'local',
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

export async function upsertGoogleUser(
  email: string,
  name?: string,
  avatar?: string
): Promise<User> {
  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await findUserByEmail(cleanEmail);

  if (existingUser) {
    if (name && !existingUser.name) {
      existingUser.name = name;
    }
    if (avatar) {
      existingUser.avatar = avatar;
    }
    existingUser.provider = 'google';
    return existingUser;
  }

  const generatedId = `google-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const displayName = name?.trim() || cleanEmail.split('@')[0];

  const newUser: User = {
    id: generatedId,
    name: displayName,
    email: cleanEmail,
    company: 'Google Account',
    passwordHash: bcrypt.hashSync(Math.random().toString(36), 10),
    avatar: avatar || '',
    provider: 'google',
  };

  demoUsers.push(newUser);
  return newUser;
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
    avatar: user.avatar || '',
    provider: user.provider || 'local',
  };
}

