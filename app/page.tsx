'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  useRaffleSystemData,
  getActiveRaffle,
  saveStoredData,
  reserveNumbersInRaffle,
  confirmNumberPayment,
  confirmBulkPayments,
  releaseNumber,
  releaseAllExpiredReservations,
  addOrUpdateSeller,
  deleteSeller,
  recordWinner,
  addExpense,
  deleteExpense,
  createNewRaffle,
  updateRaffle,
  resetToInitialDemoData,
} from '@/lib/storage';
import { Raffle, Seller, RaffleNumber, Winner, Expense } from '@/types/raffle';
import { Navbar } from '@/components/Navbar';
import { RafflePosterHero } from '@/components/RafflePosterHero';
import { RaffleGrid } from '@/components/RaffleGrid';
import { BuyerCheckoutModal } from '@/components/BuyerCheckoutModal';
import { SellerDesk } from '@/components/SellerDesk';
import { FinancialDashboard } from '@/components/FinancialDashboard';
import { ReportsView } from '@/components/ReportsView';
import { DrawModal } from '@/components/DrawModal';
import { DigitalReceiptModal } from '@/components/DigitalReceiptModal';
import { SellerManagerModal } from '@/components/SellerManagerModal';
import { RaffleSettingsModal } from '@/components/RaffleSettingsModal';
import { RaffleDetailsModal } from '@/components/RaffleDetailsModal';
import { sounds } from '@/lib/sound';
import { CheckCircle2 } from 'lucide-react';

export default function Home() {
  const data = useRaffleSystemData();
  const [activeTab, setActiveTab] = useState<'grid' | 'seller' | 'finance' | 'reports' | 'draw'>('grid');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<RaffleNumber | null>(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showNewRaffleModal, setShowNewRaffleModal] = useState(false);
  const [showEditRaffleModal, setShowEditRaffleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const activeRaffle = useMemo(() => {
    if (!data) return null;
    return getActiveRaffle(data);
  }, [data]);

  const sellers = useMemo(() => {
    return data?.sellers || [];
  }, [data]);

  const currentSellerId = data?.currentSellerId || sellers[0]?.id;

  // Numbers stats
  const { totalSold, totalReserved, totalAvailable } = useMemo(() => {
    if (!activeRaffle) return { totalSold: 0, totalReserved: 0, totalAvailable: 0 };
    const nums = Object.values(activeRaffle.numbers);
    const sold = nums.filter((n) => n.status === 'paid').length;
    const reserved = nums.filter((n) => n.status === 'reserved').length;
    const available = nums.filter((n) => n.status === 'available').length;
    return { totalSold: sold, totalReserved: reserved, totalAvailable: available };
  }, [activeRaffle]);

  // Handler: Toggle single number
  const handleToggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

  // Handler: Buyer / Seller reservation checkout
  const handleCheckoutConfirm = (payload: {
    numbers: number[];
    buyerName: string;
    buyerPhone: string;
    buyerEmail?: string;
    sellerId?: string;
    sellerName?: string;
    isImmediatePaid: boolean;
  }) => {
    if (!activeRaffle) return;

    const res = reserveNumbersInRaffle({
      raffleId: activeRaffle.id,
      numbers: payload.numbers,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      buyerEmail: payload.buyerEmail,
      sellerId: payload.sellerId,
      sellerName: payload.sellerName,
      isImmediatePaid: payload.isImmediatePaid,
    });

    if (res.success) {
      setSelectedNumbers([]);
      setShowCheckoutModal(false);
      showToast(res.message, 'success');
    } else {
      alert(res.message);
    }
  };

  // Handler: Confirm single number payment
  const handleConfirmPayment = (number: number) => {
    if (!activeRaffle) return;
    const ok = confirmNumberPayment(activeRaffle.id, number);
    if (ok) {
      showToast(`Pagamento da cota ${number.toString().padStart(2, '0')} confirmado!`, 'success');
    }
  };

  // Handler: Bulk confirm payments
  const handleBulkConfirmPayments = (numbers: number[]) => {
    if (!activeRaffle) return;
    const ok = confirmBulkPayments(activeRaffle.id, numbers);
    if (ok) {
      showToast(`${numbers.length} pagamentos confirmados com sucesso!`, 'success');
    }
  };

  // Handler: Release number
  const handleReleaseNumber = (number: number) => {
    if (!activeRaffle) return;
    const ok = releaseNumber(activeRaffle.id, number);
    if (ok) {
      showToast(`Cota ${number.toString().padStart(2, '0')} liberada para venda.`, 'info');
    }
  };

  // Handler: Release expired
  const handleReleaseExpired = () => {
    if (!activeRaffle) return;
    const count = releaseAllExpiredReservations(activeRaffle.id);
    if (count > 0) {
      showToast(`${count} reservas expiradas foram liberadas!`, 'info');
    } else {
      showToast('Nenhuma reserva expirada encontrada no momento.', 'info');
    }
  };

  // Handler: Register sale on Seller Desk
  const handleRegisterSale = (payload: {
    numbers: number[];
    buyerName: string;
    buyerPhone: string;
    sellerId: string;
    sellerName: string;
    paymentMethod: RaffleNumber['paymentMethod'];
    isPaid: boolean;
  }) => {
    if (!activeRaffle) return;
    reserveNumbersInRaffle({
      raffleId: activeRaffle.id,
      numbers: payload.numbers,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      sellerId: payload.sellerId,
      sellerName: payload.sellerName,
      paymentMethod: payload.paymentMethod,
      isImmediatePaid: payload.isPaid,
    });
  };

  // Seller management
  const handleSaveSeller = (sellerData: Partial<Seller> & { name: string; phone: string }) => {
    addOrUpdateSeller(sellerData);
    showToast(`Vendedor "${sellerData.name}" salvo com sucesso!`);
  };

  const handleDeleteSeller = (sellerId: string) => {
    deleteSeller(sellerId);
    showToast('Vendedor removido com sucesso.');
  };

  const handleSelectSeller = (sellerId: string) => {
    if (!data) return;
    const updated = { ...data, currentSellerId: sellerId };
    saveStoredData(updated);
  };

  // Expenses
  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    if (!activeRaffle) return;
    addExpense(activeRaffle.id, expense);
    showToast(`Despesa "${expense.description}" registrada.`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!activeRaffle) return;
    deleteExpense(activeRaffle.id, expenseId);
    showToast('Despesa removida.');
  };

  // Draw Winner
  const handleSaveWinner = (winner: Winner) => {
    if (!activeRaffle) return;
    recordWinner(activeRaffle.id, winner);
  };

  // Create new raffle
  const handleCreateRaffle = (newRaffle: Partial<Raffle> & { title: string; pricePerNumber: number; totalNumbers: number; pixKey: string }) => {
    const created = createNewRaffle(newRaffle);
    setShowNewRaffleModal(false);
    showToast(`Nova rifa "${created.title}" criada com sucesso!`);
  };

  // Update existing raffle
  const handleUpdateRaffle = (updatedFields: Partial<Raffle>) => {
    if (!activeRaffle) return;
    const updated: Raffle = {
      ...activeRaffle,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };
    updateRaffle(updated);
    setShowEditRaffleModal(false);
    showToast(`Rifa "${updated.title}" atualizada com sucesso!`);
  };

  // Reset to default São José Operário demo
  const handleResetDemo = () => {
    if (confirm('Deseja restaurar os dados de exemplo da Rifa de São José Operário?')) {
      resetToInitialDemoData();
      sounds.playSuccess();
      showToast('Dados restaurados com sucesso para a Rifa de São José Operário!');
    }
  };

  if (!data || !activeRaffle) {
    return (
      <div className="min-h-screen bg-[#fdfaf7] flex items-center justify-center text-[#423d38]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-[#5A5A40]">Carregando Sistema de Rifas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf7] text-[#423d38] flex flex-col font-sans selection:bg-[#D48166] selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sellers={sellers}
        currentSellerId={currentSellerId}
        onSelectSeller={handleSelectSeller}
        onOpenNewRaffle={() => setShowNewRaffleModal(true)}
        onOpenSellerManager={() => setShowSellerModal(true)}
        onResetDemo={handleResetDemo}
        activeRaffleTitle={activeRaffle.title}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8">
        {/* Tab 1: Grade & Bilhetes (Interactive Visual Cartaz) */}
        {activeTab === 'grid' && (
          <div className="animate-fade-in">
            {/* The Authentic Poster Hero Section */}
            <RafflePosterHero
              raffle={activeRaffle}
              totalSold={totalSold}
              totalReserved={totalReserved}
              totalAvailable={totalAvailable}
              onOpenCheckout={() => setShowCheckoutModal(true)}
              onOpenDetails={() => setShowDetailsModal(true)}
              onOpenEditRaffle={() => setShowEditRaffleModal(true)}
              onOpenNewRaffle={() => setShowNewRaffleModal(true)}
            />

            {/* The Interactive Visual Number Grid */}
            <RaffleGrid
              raffle={activeRaffle}
              selectedNumbers={selectedNumbers}
              onToggleNumber={handleToggleNumber}
              onSelectMultiple={setSelectedNumbers}
              onClearSelection={() => setSelectedNumbers([])}
              onOpenCheckout={() => setShowCheckoutModal(true)}
              onInspectNumber={(numData) => setShowReceiptModal(numData)}
            />
          </div>
        )}

        {/* Tab 2: Balcão do Vendedor (Fast Sales Terminal & Personal Stats) */}
        {activeTab === 'seller' && (
          <div className="animate-fade-in">
            <SellerDesk
              raffle={activeRaffle}
              sellers={sellers}
              currentSellerId={currentSellerId}
              onSelectSeller={handleSelectSeller}
              onConfirmPayment={handleConfirmPayment}
              onReleaseNumber={handleReleaseNumber}
              onRegisterSale={handleRegisterSale}
              onOpenReceipt={(numData) => setShowReceiptModal(numData)}
            />
          </div>
        )}

        {/* Tab 3: Controle Financeiro Total & Auditoria de Pagamentos */}
        {activeTab === 'finance' && (
          <div className="animate-fade-in">
            <FinancialDashboard
              raffle={activeRaffle}
              sellers={sellers}
              onConfirmPayment={handleConfirmPayment}
              onBulkConfirmPayments={handleBulkConfirmPayments}
              onReleaseNumber={handleReleaseNumber}
              onReleaseExpired={handleReleaseExpired}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        )}

        {/* Tab 4: Relatórios Automáticos & Prestação de Contas */}
        {activeTab === 'reports' && (
          <div className="animate-fade-in">
            <ReportsView
              raffle={activeRaffle}
              sellers={sellers}
              onOpenEditRaffle={() => setShowEditRaffleModal(true)}
            />
          </div>
        )}

        {/* Tab 5: Sorteador Ao Vivo & Roleta Eletrônica */}
        {activeTab === 'draw' && (
          <div className="animate-fade-in">
            <DrawModal
              raffle={activeRaffle}
              onClose={() => setActiveTab('grid')}
              onSaveWinner={handleSaveWinner}
            />
          </div>
        )}
      </main>

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up max-w-sm">
          <div className="bg-[#2d2a26] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#5A5A40] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#D48166] shrink-0" />
            <span className="text-xs font-bold">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Buyer Checkout Modal */}
      {showCheckoutModal && (
        <BuyerCheckoutModal
          raffle={activeRaffle}
          selectedNumbers={selectedNumbers}
          sellers={sellers}
          defaultSellerId={currentSellerId}
          onClose={() => setShowCheckoutModal(false)}
          onConfirm={handleCheckoutConfirm}
        />
      )}

      {/* Digital Receipt / Ticket Modal */}
      {showReceiptModal && (
        <DigitalReceiptModal
          raffle={activeRaffle}
          numberData={showReceiptModal}
          onClose={() => setShowReceiptModal(null)}
        />
      )}

      {/* Seller Manager Modal */}
      {showSellerModal && (
        <SellerManagerModal
          sellers={sellers}
          onClose={() => setShowSellerModal(false)}
          onSaveSeller={handleSaveSeller}
          onDeleteSeller={handleDeleteSeller}
        />
      )}

      {/* New Raffle Creation Modal (Iniciar Nova Nota) */}
      {showNewRaffleModal && (
        <RaffleSettingsModal
          isNew={true}
          onClose={() => setShowNewRaffleModal(false)}
          onSave={handleCreateRaffle}
        />
      )}

      {/* Edit Raffle Modal (Editar Nota & Prêmios da Rifa Atual) */}
      {showEditRaffleModal && (
        <RaffleSettingsModal
          raffle={activeRaffle}
          isNew={false}
          onClose={() => setShowEditRaffleModal(false)}
          onSave={handleUpdateRaffle}
        />
      )}

      {/* Raffle Details & Regulation Modal */}
      {showDetailsModal && (
        <RaffleDetailsModal
          raffle={activeRaffle}
          onClose={() => setShowDetailsModal(false)}
          onOpenEdit={() => {
            setShowDetailsModal(false);
            setShowEditRaffleModal(true);
          }}
        />
      )}

      {/* Footer */}
      <footer className="print:hidden bg-[#2d2a26] text-[#a89d91] py-6 border-t border-[#3d3833] text-center text-xs space-y-1">
        <div className="flex items-center justify-center gap-1 text-[#e6dfd8] font-semibold">
          <span>{activeRaffle.chapelOrOrgName}</span>
          <span>•</span>
          <span className="text-[#D48166] font-bold">{activeRaffle.title}</span>
        </div>
        <p className="text-[11px] text-[#a89d91]">
          Sistema de Rifas, Balcão de Vendedores e Controle Financeiro Automatizado
        </p>
      </footer>
    </div>
  );
}
