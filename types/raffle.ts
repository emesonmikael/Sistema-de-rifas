export type NumberStatus = 'available' | 'reserved' | 'paid';

export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'OUTRO';

export interface Prize {
  order: number;
  title: string;
  description: string;
  badge?: string;
  iconName?: string;
  donorName?: string;
  estimatedValue?: number;
  details?: string;
}

export interface Seller {
  id: string;
  name: string;
  phone: string;
  email?: string;
  pixKey?: string;
  pin?: string; // 4-6 digit numeric PIN for fast login
  password?: string;
  role: 'admin' | 'seller';
  targetNumbers?: number;
  avatarColor?: string;
  active?: boolean;
  commissionPercent?: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthSession {
  currentUser: Seller | null;
  role: 'admin' | 'seller' | 'guest';
  isAuthenticated: boolean;
  loginTime?: string;
}

export interface RaffleNumber {
  number: number;
  status: NumberStatus;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerCity?: string;
  sellerId?: string;
  sellerName?: string;
  paymentMethod?: PaymentMethod;
  reservedAt?: string;
  reservationExpiresAt?: string;
  paidAt?: string;
  notes?: string;
  receiptId?: string;
  amountPaid?: number;
  confirmedBySellerId?: string;
}

export interface Winner {
  prizeOrder: number;
  prizeTitle: string;
  number: number;
  winnerName: string;
  winnerPhone: string;
  sellerName?: string;
  drawnAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'premio' | 'divulgacao' | 'taxa' | 'outro';
  date: string;
  registeredBy?: string;
}

export interface Raffle {
  id: string;
  title: string;
  category?: string;
  causeDescription: string;
  chapelOrOrgName: string;
  location?: string;
  bannerTheme?: string;
  prizes: Prize[];
  pricePerNumber: number;
  totalNumbers: number;
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  pixReceiverName?: string;
  pixCity?: string;
  drawDate?: string;
  drawTime?: string;
  drawLocation?: string;
  regulation?: string;
  notes?: string;
  status: 'active' | 'drawn' | 'cancelled';
  numbers: Record<number, RaffleNumber>;
  winners?: Winner[];
  expenses?: Expense[];
  reservationTimeoutHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemData {
  raffles: Raffle[];
  activeRaffleId: string;
  sellers: Seller[];
  currentSellerId?: string;
}
