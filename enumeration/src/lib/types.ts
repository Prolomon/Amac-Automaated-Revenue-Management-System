export interface Guarantor {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Wallet {
  id?: string;
  accountNo?: string;
  balance: number;
  accountName?: string;
  bankName?: string;
}

export type EnumeratorLevel = "BASIC" | "SUPER";

export interface EnumeratorUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string; // WhatsApp
  avatar?: string;
  dob?: string;
  address?: string;
  center: string;
  zone?: string;
  level: EnumeratorLevel;
  supervisorId?: string;
  status: boolean;
  role: string;
  guarantor1?: Guarantor;
  guarantor2?: Guarantor;
  wallet?: Wallet;
  supervisor?: {
    uid: string;
    name: string;
    phone: string;
    email: string;
  };
}

export interface PropertyCapture {
  id: string;
  pid?: string;
  name?: string;
  type?: string;
  size?: string;
  address: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    state?: string;
    city?: string;
  };
  images: string[];
  center?: string;
  zone?: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  rejectionReason?: string;
  reward: number;
  enumeratorId?: string;
  supervisorId?: string;
  approvedAt?: string;
  createdAt: string;
  enumerator?: {
    uid: string;
    name: string;
    phone: string;
    email: string;
    center: string;
  };
  member?: {
    uid: string;
    fullname: string;
    businessName?: string;
    phone: string;
  };
}

export interface RegisteredMember {
  id?: string;
  uid?: string;
  fullname: string;
  businessName?: string;
  email: string;
  phone: string;
  bvn: string;
  type: "BUSINESS" | "INDIVIDUAL";
  category?: string;
  center?: string;
  zone?: string;
  billingFrequency?: "MONTHLY" | "QUARTERLY" | "YEARLY";
  document?: {
    type: string;
    number: string;
    bvn?: string;
    data?: any;
  };
  enumerationStatus?: "PENDING" | "APPROVED" | "DENIED";
  rejectionReason?: string;
  location?: {
    address: string;
    city?: string;
    state?: string;
    nearestBusStop?: string;
    zipcode?: string;
  };
  property?: any;
  createdAt?: string;
}

export interface DailyTaskProgress {
  date: string;
  captures: {
    submitted: number;
    approved: number;
    target: number;
    rate: number;
    earned: number;
    percent: number;
  };
  registrations: {
    submitted: number;
    approved: number;
    target: number;
    rate: number;
    earned: number;
    percent: number;
  };
  earnings: {
    today: number;
    balance: number;
  };
}

export interface AuthContextValue {
  user: EnumeratorUser | null;
  wallet: Wallet | null;
  level: EnumeratorLevel | null;
  token: string | null;
  loading: boolean;
  dailyTasks: DailyTaskProgress | null;
  login: (emailOrPhone: string, password: string, requiredLevel?: EnumeratorLevel) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshDailyTasks: () => Promise<void>;
}
