export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "QUARTERLY";

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

export type Payment = {
  id?: string;
  reference: string;
  userId: string;
  frequency: Frequency;
  date: string;
  amount: number;
  payment: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED" | "COMPLETED";
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
