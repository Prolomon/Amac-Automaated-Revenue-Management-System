export type BusinessType = {
  id?: string;
  title: string;
  price: string;
  type: "BUSINESS" | "INDIVIDUAL";
  benefit: string;
};

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "QUARTERLY";

export type User = {
  id?: string;
  uid?: string;
  name?: string;
  fullname: string;
  email: string;
  phone: string;
  gender: string;
  status?: boolean;
  password?: string;
  location?: string;
  avatar?: string;
  center?: string;
  company: string;
  batchNo: string;
  zone?: string;
  secureToken?: string;
  role?: "AGENT";
  createdAt?: Date;
  updatedAt?: Date;
}

export type Notification = {
  title: string;
  description: string;
  date: string;
  type:
    | "UPDATE"
    | "SUCCESS"
    | "FAILED"
    | "PENDING"
    | "REQUEST"
    | "REMINDER"
    | "WELCOME";
};

export type Payment = {
  id?: string;
  reference: string;
  userId: string;
  frequency: Frequency;
  date: string;
  amount: number;
  payment: string;
  status:
    | "PENDING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED"
    | "REFUNDED"
    | "COMPLETED";
  due: Date | null;
  member?: Member;
  isVerified: boolean;
  pricing: Pricing;
  paid: number;
  sessions: string[];
  debt: number;
  createdAt?: Date;
  updatedAt?: Date;
  center?: string;
  company?: string;
};

export type Member = {
  id?: string;
  uid?: string;
  fullname: string;
  businessName?: string;
  center?: string;
  email: string;
  phone: string;
  type: "BUSINESS" | "INDIVIDUAL";
  category: string;
  company?: string;
  billingFrequency?: Frequency;
  password?: string;
  location?: {
    state: string;
    city: string;
    address: string;
    zipcode: string;
    nearestBusStop: string;
  };
  status?: boolean;
  avatar?: string;
  secureToken?: string;
  pricing?: string[];
  role?: "USER" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
  agent?: string;
};

export type AuthContextValue = {
  currentUser: User | null;
  loading: boolean;
  register: (user: Omit<Member, "uid" | "role" | "createdAt">) => Promise<{
    message: string;
    ok: boolean;
  }>;
  login: (
    uid: string,
    password: string,
  ) => Promise<{
    ok: boolean;
    message?: string;
    error?: string;
    token?: string;
  }>;
  logout: () => Promise<void>;
  updateProfile: (
    updates: Partial<User>,
    token?: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  forgot: (
    uid: string,
    password: string,
    confirm: string,
    old: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  notifications: () => Promise<Notification[]>;
  receipt: (reference: string) => Promise<Payment | any>;
  payments: () => Promise<Payment[]>;
  members: () => Promise<Member[]>;
  agentList: () => Promise<any[]>;
  getBusiness: () => Promise<BusinessType[]>;
  verifyPayment: ({ reference, session }: { reference: string; session: string }) => Promise<{
    fullname: string;
    memberName: string;
    businessName: string;
    userId: string;
    ok: boolean;
    payment?: any;
    message?: string;
  }>;
  wallet: Wallet | null;
  token?: string;
  createCode: (
    secureToken: string,
    confirmSecureToken: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  changeCode: (
    oldSecureToken: string,
    newSecureToken: string,
    confirmSecureToken: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  verifyCode: (
    secureToken: string,
  ) => Promise<{ ok: boolean; message?: string; error?: string }>;
  code: string | null;
};

export type Pricing = {
  status?: boolean;
  id?: string;
  title: string;
  price: string;
  category: string;
  type: string;
  benefit: string;
  center?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Wallet = {
  id: string;
  userId?: string;
  role: "MEMBER" | "ADMIN" | "AGENT" | "PARTNER" | "STAFF";
  balance?: number;
  accountNo?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: boolean;
  accountName: string;
  currency: string;
  bank: {
    id: string;
    name: string;
  };
  identification?: "NIN" | "BVN";
  verify?: boolean;
};

export type Transaction = {
  id: string;
  reference: string;
  event: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  channel: string | null;
  gatewayResponse: string | null;
  customerEmail: string | null;
  paymentReference: string | null;
  userId: string | null;
  metadata: object | null;
  rawPayload: object | null;
  createdAt: Date;
  updatedAt: Date;
  payment: string;
};

export enum TransactionStatus {
  PENDING,
  SUCCESS,
  FAILED,
  REFUNDED,
  CANCELLED
}
