import { INITIAL_SYSTEM_DATA } from './initialData';
import { Raffle, RaffleNumber, Seller, SystemData, Winner, Expense } from '@/types/raffle';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'rifa_pix_system_v1';

let memoryCache: SystemData | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function subscribeToRaffleData(callback: () => void): () => void {
  listeners.add(callback);
  const handleStorageOrWindow = () => {
    memoryCache = null;
    callback();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('rifa_data_updated', handleStorageOrWindow);
    window.addEventListener('storage', handleStorageOrWindow);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('rifa_data_updated', handleStorageOrWindow);
      window.removeEventListener('storage', handleStorageOrWindow);
    }
  };
}

export function getStoredDataSnapshot(): SystemData {
  if (typeof window === 'undefined') {
    return INITIAL_SYSTEM_DATA;
  }
  if (!memoryCache) {
    memoryCache = getStoredData();
  }
  return memoryCache;
}

export function useRaffleSystemData(): SystemData {
  return useSyncExternalStore(
    subscribeToRaffleData,
    getStoredDataSnapshot,
    () => INITIAL_SYSTEM_DATA
  );
}

export function getStoredData(): SystemData {
  if (typeof window === 'undefined') {
    return INITIAL_SYSTEM_DATA;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SYSTEM_DATA));
      memoryCache = INITIAL_SYSTEM_DATA;
      return INITIAL_SYSTEM_DATA;
    }
    const parsed = JSON.parse(raw) as SystemData;
    if (!parsed.raffles || parsed.raffles.length === 0) {
      memoryCache = INITIAL_SYSTEM_DATA;
      return INITIAL_SYSTEM_DATA;
    }
    memoryCache = parsed;
    return parsed;
  } catch (err) {
    console.error('Failed to parse stored raffle data:', err);
    memoryCache = INITIAL_SYSTEM_DATA;
    return INITIAL_SYSTEM_DATA;
  }
}

export function saveStoredData(data: SystemData): void {
  memoryCache = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event('rifa_data_updated'));
    } catch (err) {
      console.error('Failed to save raffle data:', err);
    }
  }
  notifyListeners();
}

export function getActiveRaffle(data: SystemData): Raffle {
  const found = data.raffles.find((r) => r.id === data.activeRaffleId);
  return found || data.raffles[0] || INITIAL_SYSTEM_DATA.raffles[0];
}

// Helpers for common operations
export function reserveNumbersInRaffle({
  raffleId,
  numbers,
  buyerName,
  buyerPhone,
  buyerEmail,
  sellerId,
  sellerName,
  paymentMethod = 'PIX',
  isImmediatePaid = false,
}: {
  raffleId: string;
  numbers: number[];
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  sellerId?: string;
  sellerName?: string;
  paymentMethod?: RaffleNumber['paymentMethod'];
  isImmediatePaid?: boolean;
}): { success: boolean; message: string } {
  const current = getStoredData();
  const raffleIndex = current.raffles.findIndex((r) => r.id === raffleId);

  if (raffleIndex === -1) {
    return { success: false, message: 'Rifa não encontrada.' };
  }

  const raffle = current.raffles[raffleIndex];
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + (raffle.reservationTimeoutHours || 24) * 60 * 60 * 1000
  ).toISOString();

  // Validate availability
  for (const num of numbers) {
    const existing = raffle.numbers[num];
    if (existing && existing.status === 'paid') {
      return {
        success: false,
        message: `O número ${num.toString().padStart(2, '0')} já foi pago e não pode ser reservado.`,
      };
    }
  }

  // Update numbers
  const updatedNumbers = { ...raffle.numbers };
  for (const num of numbers) {
    const existing = updatedNumbers[num] || { number: num, status: 'available' };
    updatedNumbers[num] = {
      ...existing,
      number: num,
      status: isImmediatePaid ? 'paid' : 'reserved',
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerEmail: buyerEmail ? buyerEmail.trim() : undefined,
      sellerId: sellerId || undefined,
      sellerName: sellerName || undefined,
      reservedAt: existing.reservedAt || now,
      reservationExpiresAt: isImmediatePaid ? undefined : expiresAt,
      paidAt: isImmediatePaid ? now : undefined,
      paymentMethod: paymentMethod,
      amountPaid: isImmediatePaid ? raffle.pricePerNumber : undefined,
      confirmedBySellerId: isImmediatePaid ? sellerId : undefined,
    };
  }

  const updatedRaffle: Raffle = {
    ...raffle,
    numbers: updatedNumbers,
    updatedAt: now,
  };

  current.raffles[raffleIndex] = updatedRaffle;
  saveStoredData(current);

  return {
    success: true,
    message: isImmediatePaid
      ? `${numbers.length} cota(s) confirmada(s) e paga(s) com sucesso!`
      : `${numbers.length} cota(s) reservada(s) com sucesso. Aguardando confirmação do PIX.`,
  };
}

export function confirmNumberPayment(
  raffleId: string,
  number: number,
  confirmedBySellerId?: string
): boolean {
  const current = getStoredData();
  const raffleIndex = current.raffles.findIndex((r) => r.id === raffleId);
  if (raffleIndex === -1) return false;

  const raffle = current.raffles[raffleIndex];
  const numData = raffle.numbers[number];
  if (!numData) return false;

  const now = new Date().toISOString();
  raffle.numbers[number] = {
    ...numData,
    status: 'paid',
    paidAt: now,
    reservationExpiresAt: undefined,
    amountPaid: raffle.pricePerNumber,
    confirmedBySellerId: confirmedBySellerId || numData.sellerId,
  };

  raffle.updatedAt = now;
  current.raffles[raffleIndex] = raffle;
  saveStoredData(current);
  return true;
}

export function confirmBulkPayments(
  raffleId: string,
  numbers: number[],
  confirmedBySellerId?: string
): boolean {
  const current = getStoredData();
  const raffleIndex = current.raffles.findIndex((r) => r.id === raffleId);
  if (raffleIndex === -1) return false;

  const raffle = current.raffles[raffleIndex];
  const now = new Date().toISOString();

  numbers.forEach((num) => {
    const numData = raffle.numbers[num];
    if (numData) {
      raffle.numbers[num] = {
        ...numData,
        status: 'paid',
        paidAt: now,
        reservationExpiresAt: undefined,
        amountPaid: raffle.pricePerNumber,
        confirmedBySellerId: confirmedBySellerId || numData.sellerId,
      };
    }
  });

  raffle.updatedAt = now;
  current.raffles[raffleIndex] = raffle;
  saveStoredData(current);
  return true;
}

export function releaseNumber(raffleId: string, number: number): boolean {
  const current = getStoredData();
  const raffleIndex = current.raffles.findIndex((r) => r.id === raffleId);
  if (raffleIndex === -1) return false;

  const raffle = current.raffles[raffleIndex];
  raffle.numbers[number] = {
    number,
    status: 'available',
  };

  raffle.updatedAt = new Date().toISOString();
  current.raffles[raffleIndex] = raffle;
  saveStoredData(current);
  return true;
}

export function releaseAllExpiredReservations(raffleId: string): number {
  const current = getStoredData();
  const raffleIndex = current.raffles.findIndex((r) => r.id === raffleId);
  if (raffleIndex === -1) return 0;

  const raffle = current.raffles[raffleIndex];
  const now = new Date().getTime();
  let releasedCount = 0;

  Object.keys(raffle.numbers).forEach((key) => {
    const num = Number(key);
    const item = raffle.numbers[num];
    if (item && item.status === 'reserved' && item.reservationExpiresAt) {
      const exp = new Date(item.reservationExpiresAt).getTime();
      if (exp < now) {
        raffle.numbers[num] = {
          number: num,
          status: 'available',
        };
        releasedCount++;
      }
    }
  });

  if (releasedCount > 0) {
    raffle.updatedAt = new Date().toISOString();
    current.raffles[raffleIndex] = raffle;
    saveStoredData(current);
  }

  return releasedCount;
}

export function addOrUpdateSeller(seller: Partial<Seller> & { name: string; phone: string }): Seller {
  const current = getStoredData();
  let targetSeller: Seller;

  if (seller.id) {
    const index = current.sellers.findIndex((s) => s.id === seller.id);
    if (index !== -1) {
      targetSeller = {
        ...current.sellers[index],
        ...seller,
        pin: seller.pin !== undefined ? seller.pin : (current.sellers[index].pin || '1234'),
        role: seller.role || current.sellers[index].role || 'seller',
      };
      current.sellers[index] = targetSeller;
    } else {
      targetSeller = {
        id: seller.id,
        name: seller.name,
        phone: seller.phone,
        email: seller.email,
        pixKey: seller.pixKey,
        pin: seller.pin || '1234',
        role: seller.role || 'seller',
        targetNumbers: seller.targetNumbers || 20,
        commissionPercent: seller.commissionPercent || 0,
        createdAt: new Date().toISOString(),
      };
      current.sellers.push(targetSeller);
    }
  } else {
    targetSeller = {
      id: `seller-${Date.now()}`,
      name: seller.name,
      phone: seller.phone,
      email: seller.email,
      pixKey: seller.pixKey,
      pin: seller.pin || '1234',
      role: seller.role || 'seller',
      targetNumbers: seller.targetNumbers || 20,
      commissionPercent: seller.commissionPercent || 0,
      createdAt: new Date().toISOString(),
    };
    current.sellers.push(targetSeller);
  }

  saveStoredData(current);
  return targetSeller;
}

export function updateSellerPin(sellerId: string, newPin: string): boolean {
  const current = getStoredData();
  const seller = current.sellers.find((s) => s.id === sellerId);
  if (!seller) return false;

  seller.pin = newPin.trim();
  saveStoredData(current);
  return true;
}

export function recordSellerLogin(sellerId: string): void {
  const current = getStoredData();
  const seller = current.sellers.find((s) => s.id === sellerId);
  if (seller) {
    seller.lastLoginAt = new Date().toISOString();
    current.currentSellerId = sellerId;
    saveStoredData(current);
  }
}

export function deleteSeller(sellerId: string): boolean {
  const current = getStoredData();
  const initialLen = current.sellers.length;
  current.sellers = current.sellers.filter((s) => s.id !== sellerId);
  if (current.currentSellerId === sellerId) {
    current.currentSellerId = current.sellers[0]?.id;
  }
  saveStoredData(current);
  return current.sellers.length < initialLen;
}

export function recordWinner(raffleId: string, winner: Winner): void {
  const current = getStoredData();
  const raffle = current.raffles.find((r) => r.id === raffleId);
  if (!raffle) return;

  raffle.winners = [...(raffle.winners || []), winner];
  raffle.updatedAt = new Date().toISOString();
  saveStoredData(current);
}

export function addExpense(raffleId: string, expense: Omit<Expense, 'id'>): Expense {
  const current = getStoredData();
  const raffle = current.raffles.find((r) => r.id === raffleId);
  const newExp: Expense = {
    ...expense,
    id: `exp-${Date.now()}`,
  };

  if (raffle) {
    raffle.expenses = [...(raffle.expenses || []), newExp];
    raffle.updatedAt = new Date().toISOString();
    saveStoredData(current);
  }

  return newExp;
}

export function deleteExpense(raffleId: string, expenseId: string): void {
  const current = getStoredData();
  const raffle = current.raffles.find((r) => r.id === raffleId);
  if (!raffle || !raffle.expenses) return;

  raffle.expenses = raffle.expenses.filter((e) => e.id !== expenseId);
  raffle.updatedAt = new Date().toISOString();
  saveStoredData(current);
}

export function createNewRaffle(
  data: Partial<Raffle> & { title: string; pricePerNumber: number; totalNumbers: number; pixKey: string }
): Raffle {
  const current = getStoredData();
  const id = `raffle-${Date.now()}`;
  const total = data.totalNumbers || 50;

  const numbers: Record<number, RaffleNumber> = {};
  for (let i = 1; i <= total; i++) {
    numbers[i] = { number: i, status: 'available' };
  }

  const newRaffle: Raffle = {
    id,
    title: data.title,
    category: data.category || 'Ação Solidária',
    causeDescription: data.causeDescription || 'Em prol da comunidade',
    chapelOrOrgName: data.chapelOrOrgName || 'Capela de São José Operário',
    location: data.location || 'Comunidade Vaca Morta',
    prizes: data.prizes || [
      {
        order: 1,
        title: '1º PRÊMIO',
        description: 'Prêmio Principal',
        estimatedValue: 500,
        donorName: 'Doação de Colaboradores',
        details: 'Prêmio oficial da rifa',
      },
    ],
    pricePerNumber: data.pricePerNumber,
    totalNumbers: total,
    pixKey: data.pixKey,
    pixKeyType: data.pixKeyType || 'email',
    pixReceiverName: data.pixReceiverName || '',
    pixCity: data.pixCity || '',
    drawDate: data.drawDate || '',
    drawTime: data.drawTime || '',
    drawLocation: data.drawLocation || '',
    regulation:
      data.regulation ||
      '1. O sorteio será realizado na data prevista com base nas cotas pagas.\n2. O contemplado será notificado via ligação ou mensagem oficial.',
    notes: data.notes || '',
    status: 'active',
    numbers,
    winners: [],
    expenses: [],
    reservationTimeoutHours: data.reservationTimeoutHours || 24,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  current.raffles.push(newRaffle);
  current.activeRaffleId = id;
  saveStoredData(current);
  return newRaffle;
}

export function expandRaffleNumbers(raffleId: string, additionalCount: number): { success: boolean; newTotal: number; message: string } {
  const current = getStoredData();
  const index = current.raffles.findIndex((r) => r.id === raffleId);
  if (index === -1) {
    return { success: false, newTotal: 0, message: 'Rifa não encontrada.' };
  }

  const raffle = current.raffles[index];
  const oldTotal = raffle.totalNumbers;
  const newTotal = oldTotal + additionalCount;

  const updatedNumbers = { ...raffle.numbers };
  for (let i = oldTotal + 1; i <= newTotal; i++) {
    if (!updatedNumbers[i]) {
      updatedNumbers[i] = { number: i, status: 'available' };
    }
  }

  current.raffles[index] = {
    ...raffle,
    totalNumbers: newTotal,
    numbers: updatedNumbers,
    updatedAt: new Date().toISOString(),
  };

  saveStoredData(current);
  return {
    success: true,
    newTotal,
    message: `Rifa expandida com sucesso! Adicionadas +${additionalCount} cotas. Total agora: ${newTotal} cotas.`,
  };
}

export function updateRaffle(raffle: Raffle): void {
  const current = getStoredData();
  const index = current.raffles.findIndex((r) => r.id === raffle.id);
  if (index !== -1) {
    const existingRaffle = current.raffles[index];
    const updatedNumbers = { ...existingRaffle.numbers, ...(raffle.numbers || {}) };

    // Ensure all numbers from 1 to raffle.totalNumbers are present
    for (let i = 1; i <= raffle.totalNumbers; i++) {
      if (!updatedNumbers[i]) {
        updatedNumbers[i] = { number: i, status: 'available' };
      }
    }

    current.raffles[index] = {
      ...existingRaffle,
      ...raffle,
      numbers: updatedNumbers,
      updatedAt: new Date().toISOString(),
    };
    saveStoredData(current);
  }
}

export function setActiveRaffleId(raffleId: string): void {
  const current = getStoredData();
  const exists = current.raffles.some((r) => r.id === raffleId);
  if (exists) {
    current.activeRaffleId = raffleId;
    saveStoredData(current);
  }
}

export function deleteRaffle(raffleId: string): boolean {
  const current = getStoredData();
  if (current.raffles.length <= 1) {
    return false; // Prevent deleting the only remaining raffle
  }
  const initialLen = current.raffles.length;
  current.raffles = current.raffles.filter((r) => r.id !== raffleId);
  if (current.activeRaffleId === raffleId) {
    current.activeRaffleId = current.raffles[0].id;
  }
  saveStoredData(current);
  return current.raffles.length < initialLen;
}

export function resetToInitialDemoData(): void {
  memoryCache = INITIAL_SYSTEM_DATA;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SYSTEM_DATA));
    window.dispatchEvent(new Event('rifa_data_updated'));
  }
  notifyListeners();
}
