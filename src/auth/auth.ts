import { Role } from '../types';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  role: Role;
  verificationStatus: VerificationStatus;
  passwordHash: string;
  mobile?: string;
  location?: string;
  organizationName?: string;
  details?: string;
}

const USERS_KEY = 'kabadiwala_connect_auth_users_v1';
const SESSION_KEY = 'kabadiwala_connect_auth_session_v1';

const demoUsers: AuthUser[] = [
  {
    uid: 'demo-user',
    name: 'Pooja Sharma',
    email: 'user.demo@kabadiwala.connect',
    role: 'USER',
    verificationStatus: 'approved',
    passwordHash: '8a6fa8f54b0dde881f8f0e7359c17352bd8763bddf2ed3aa23c222be09b0c2bb',
    mobile: '+91 98765 67890',
    location: 'Malviya Nagar, New Delhi',
  },
  {
    uid: 'demo-collector',
    name: 'Ramesh Kumar',
    email: 'collector.demo@kabadiwala.connect',
    role: 'COLLECTOR',
    verificationStatus: 'approved',
    passwordHash: 'f16824dba8a27e2633384b27982d85b340ef2709f4e5b9d6997406a32081f602',
    mobile: '+91 98765 43210',
    location: 'Ward 14, New Delhi',
    details: 'Licensed neighbourhood e-waste collector',
  },
  {
    uid: 'demo-recycler',
    name: 'EcoCycle Hub',
    email: 'recycler.demo@kabadiwala.connect',
    role: 'RECYCLER',
    verificationStatus: 'approved',
    passwordHash: '6cebdd446e402c28c013a8a03f09f89d353f5683d867aabf8ad8edc7192805a3',
    mobile: '+91 98765 12345',
    location: 'Okhla Industrial Area, New Delhi',
    organizationName: 'EcoCycle Hub #04',
    details: 'Authorized e-waste dismantling and recycling facility',
  },
  {
    uid: 'demo-cpcb',
    name: 'CPCB Authority',
    email: 'authority.demo@cpcb.gov.in',
    role: 'ADMIN',
    verificationStatus: 'approved',
    passwordHash: '1729e920abed30b0925a4c88c981c0e73b6bcf7ad70914ad69985b336e9f9c7f',
    location: 'CPCB HQ, New Delhi',
  },
];

const readUsers = (): AuthUser[] => {
  try {
    const stored = window.localStorage.getItem(USERS_KEY);
    if (!stored) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
      return demoUsers;
    }
    const storedUsers = JSON.parse(stored) as AuthUser[];
    const knownIds = new Set(storedUsers.map((user) => user.uid));
    const missingDemoUsers = demoUsers.filter((user) => !knownIds.has(user.uid));
    if (missingDemoUsers.length > 0) {
      const mergedUsers = [...storedUsers, ...missingDemoUsers];
      window.localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));
      return mergedUsers;
    }
    return storedUsers;
  } catch {
    return demoUsers;
  }
};

const writeUsers = (users: AuthUser[]) => {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const hashPassword = async (password: string) => {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const getSession = (): AuthUser | null => {
  try {
    const session = window.localStorage.getItem(SESSION_KEY);
    return session ? (JSON.parse(session) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const signOut = () => window.localStorage.removeItem(SESSION_KEY);

export const signIn = async (email: string, password: string, selectedRole: Role, userLocation?: string) => {
  const users = readUsers();
  const userIndex = users.findIndex(
    (candidate) =>
      candidate.email.toLowerCase() === email.trim().toLowerCase() &&
      candidate.role === selectedRole,
  );

  if (userIndex === -1 || users[userIndex].passwordHash !== (await hashPassword(password))) {
    throw new Error('Invalid email, password, or selected role.');
  }

  let user = users[userIndex];
  if (userLocation && userLocation.trim() !== '') {
    user = { ...user, location: userLocation.trim() };
    users[userIndex] = user;
    writeUsers(users);
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

export const registerUser = async (
  profile: Omit<AuthUser, 'uid' | 'passwordHash' | 'verificationStatus'>,
  password: string,
) => {
  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === profile.email.trim().toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  const user: AuthUser = {
    ...profile,
    uid: `${profile.role.toLowerCase()}-${Date.now()}`,
    verificationStatus: profile.role === 'USER' ? 'approved' : 'pending',
    passwordHash: await hashPassword(password),
  };
  writeUsers([...users, user]);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};
