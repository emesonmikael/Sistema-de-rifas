'use client';

import React, { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import {
  useRaffleSystemData,
  getActiveRaffle,
  saveStoredData,
  getStoredData,
  reserveNumbersInRaffle,
  confirmNumberPayment,
  confirmBulkPayments,
  releaseNumber,
  releaseAllExpiredReservations,
  addOrUpdateSeller,
  deleteSeller,
  updateSellerPin,
  recordSellerLogin,
  logoutSeller,
  recordWinner,
  addExpense,
  deleteExpense,
  createNewRaffle,
  updateRaffle,
  expandRaffleNumbers,
  resetToInitialDemoData,
  setActiveRaffleId,
  deleteRaffle,
  clearSimulationSellers,
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
import { ExpandNumbersModal } from '@/components/ExpandNumbersModal';
import { GoogleSheetsSyncModal } from '@/components/GoogleSheetsSyncModal';
import { AuthModal } from '@/components/AuthModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import { RaffleManagerModal } from '@/components/RaffleManagerModal';
import {
  syncRaffleToGoogleSheets,
  fetchRaffleFromGoogleSheets,
  deleteRaffleFromGoogleSheets,
  getSheetsConfig,
} from '@/lib/sheetsSync';
import { sounds } from '@/lib/sound';
import { CheckCircle2, ShieldAlert, Lock, ArrowRight, UserCheck, RefreshCw, FileSpreadsheet, Gift } from 'lucide-react';

const emptySubscribe = () => () => {};

function useIsClientMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function useNeedsInitialAuth() {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      try {
        const raw = localStorage.getItem('rifa_pix_system_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          return !parsed.currentSellerId;
        }
        return true;
      } catch {
        return true;
      }
    },
    () => false
  );
}

export default function Home() {
  const data = useRaffleSystemData();
  const isClientMounted = useIsClientMounted();
  const needsInitialAuth = useNeedsInitialAuth();

  const [activeTab, setActiveTab] = useState<'grid' | 'seller' | 'finance' | 'reports' | 'draw'>('grid');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  // Auth & Session State
  const [authModalOverride, setAuthModalOverride] = useState<boolean | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const showAuthModal =
    isClientMounted &&
    (authModalOverride !== null
      ? authModalOverride
      : !isGuestMode && needsInitialAuth && !data?.currentSellerId);

  const setShowAuthModal = useCallback((open: boolean) => {
    setAuthModalOverride(open);
  }, []);

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<RaffleNumber | null>(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showNewRaffleModal, setShowNewRaffleModal] = useState(false);
  const [showEditRaffleModal, setShowEditRaffleModal] = useState(false);
  const [showRaffleManagerModal, setShowRaffleManagerModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExpandNumbersModal, setShowExpandNumbersModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  const activeRaffle = useMemo(() => {
    if (!data) return null;
    return getActiveRaffle(data);
  }, [data]);

  // Initial Load from Google Sheets on Page Mount
  React.useEffect(() => {
    let isMounted = true;
    const config = getSheetsConfig();
    if (config.webhookUrl && activeRaffle) {
      fetchRaffleFromGoogleSheets(activeRaffle.id)
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.numbersCount && res.numbersCount > 0) {
            showToast(`Dados da Planilha Google Sheets carregados (${res.numbersCount} cotas ativas)!`, 'info');
          }
        })
        .catch((err) => console.error('Initial sheets sync error:', err));
    }
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to trigger background Google Sheets sync if autoSync is active
  const triggerSheetsAutoSync = useCallback((raffleToSync?: Raffle | string) => {
    const config = getSheetsConfig();
    if (config.autoSync && config.webhookUrl) {
      const freshData = getStoredData();
      let targetRaffle: Raffle | undefined;

      if (typeof raffleToSync === 'string') {
        targetRaffle = freshData.raffles.find((r) => r.id === raffleToSync);
      } else if (raffleToSync && typeof raffleToSync === 'object') {
        targetRaffle = freshData.raffles.find((r) => r.id === raffleToSync.id);
      }

      if (!targetRaffle) {
        targetRaffle = freshData.raffles.find((r) => r.id === freshData.activeRaffleId) || freshData.raffles[0];
      }

      if (targetRaffle) {
        syncRaffleToGoogleSheets(targetRaffle, 'FULL_SYNC').catch((err) =>
          console.error('Background sheets sync error:', err)
        );
      }
    }
  }, []);

  const sellers = useMemo(() => {
    return data?.sellers || [];
  }, [data]);

  // Current logged user
  const currentSellerId = data?.currentSellerId;
  const currentUser = useMemo(() => {
    if (isGuestMode || !currentSellerId) return null;
    const found = sellers.find((s) => s.id === currentSellerId);
    return found || null;
  }, [sellers, currentSellerId, isGuestMode]);

  const isAdmin = currentUser?.role === 'admin';

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

    // Security: Only logged-in sellers or admins can mark a ticket directly as paid.
    // Public visitors/buyers will always have their ticket created as 'reserved'.
    const canMarkPaid = Boolean(currentUser) && payload.isImmediatePaid;

    const res = reserveNumbersInRaffle({
      raffleId: activeRaffle.id,
      numbers: payload.numbers,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      buyerEmail: payload.buyerEmail,
      sellerId: payload.sellerId,
      sellerName: payload.sellerName,
      isImmediatePaid: canMarkPaid,
    });

    if (res.success) {
      setSelectedNumbers([]);
      setShowCheckoutModal(false);
      showToast(res.message, 'success');
      triggerSheetsAutoSync(activeRaffle);
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
      triggerSheetsAutoSync(activeRaffle);
    }
  };

  // Handler: Bulk confirm payments
  const handleBulkConfirmPayments = (numbers: number[]) => {
    if (!activeRaffle) return;
    const ok = confirmBulkPayments(activeRaffle.id, numbers);
    if (ok) {
      showToast(`${numbers.length} pagamentos confirmados com sucesso!`, 'success');
      triggerSheetsAutoSync(activeRaffle);
    }
  };

  // Handler: Release number
  const handleReleaseNumber = (number: number) => {
    if (!activeRaffle) return;
    const ok = releaseNumber(activeRaffle.id, number);
    if (ok) {
      showToast(`Cota ${number.toString().padStart(2, '0')} liberada para venda.`, 'info');
      triggerSheetsAutoSync(activeRaffle);
    }
  };

  // Handler: Release expired
  const handleReleaseExpired = () => {
    if (!activeRaffle) return;
    const count = releaseAllExpiredReservations(activeRaffle.id);
    if (count > 0) {
      showToast(`${count} reservas expiradas foram liberadas!`, 'info');
      triggerSheetsAutoSync(activeRaffle);
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
    const res = reserveNumbersInRaffle({
      raffleId: activeRaffle.id,
      numbers: payload.numbers,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      sellerId: payload.sellerId,
      sellerName: payload.sellerName,
      paymentMethod: payload.paymentMethod,
      isImmediatePaid: payload.isPaid,
    });
    if (res.success) {
      showToast(res.message, 'success');
      triggerSheetsAutoSync(activeRaffle);
    } else {
      alert(res.message);
    }
  };

  // Seller management
  const handleSaveSeller = (sellerData: Partial<Seller> & { name: string; phone: string }) => {
    addOrUpdateSeller(sellerData);
    showToast(`Vendedor "${sellerData.name}" salvo com sucesso!`);
    if (activeRaffle) triggerSheetsAutoSync(activeRaffle.id);
  };

  const handleDeleteSeller = (sellerId: string) => {
    deleteSeller(sellerId);
    showToast('Vendedor removido com sucesso.');
    if (activeRaffle) triggerSheetsAutoSync(activeRaffle.id);
  };

  const handleSelectSeller = (sellerId: string) => {
    if (!data) return;
    const updated = { ...data, currentSellerId: sellerId };
    saveStoredData(updated);
  };

  // Auth handlers
  const handleLoginSuccess = (seller: Seller) => {
    setIsGuestMode(false);
    recordSellerLogin(seller.id);
    handleSelectSeller(seller.id);
    showToast(
      `Conectado como ${seller.name} (${seller.role === 'admin' ? 'Coordenador / ADM' : 'Vendedor'})`,
      'success'
    );
  };

  const handleLogout = () => {
    logoutSeller();
    setIsGuestMode(true);
    setShowProfileModal(false);
    setShowAuthModal(true);
    showToast('Sessão encerrada. Escolha um usuário para entrar.', 'info');
  };

  const handleUpdatePin = (newPin: string) => {
    if (!currentUser) return;
    updateSellerPin(currentUser.id, newPin);
    showToast('PIN de acesso atualizado com sucesso!', 'success');
  };

  // Expenses
  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    if (!activeRaffle) return;
    addExpense(activeRaffle.id, expense);
    showToast(`Despesa "${expense.description}" registrada.`);
    triggerSheetsAutoSync(activeRaffle.id);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!activeRaffle) return;
    deleteExpense(activeRaffle.id, expenseId);
    showToast('Despesa removida.');
    triggerSheetsAutoSync(activeRaffle.id);
  };

  // Draw Winner
  const handleSaveWinner = (winner: Winner) => {
    if (!activeRaffle) return;
    recordWinner(activeRaffle.id, winner);
    triggerSheetsAutoSync(activeRaffle.id);
  };

  // Create new raffle
  const handleCreateRaffle = (
    newRaffle: Partial<Raffle> & {
      title: string;
      pricePerNumber: number;
      totalNumbers: number;
      pixKey: string;
      initialCoordinator?: {
        name: string;
        phone: string;
        email?: string;
        pixKey?: string;
        pin?: string;
        role: 'admin' | 'seller';
        targetNumbers?: number;
        clearDemoSellers?: boolean;
      };
    }
  ) => {
    // Process initial coordinator or clear simulation sellers if requested
    if (newRaffle.initialCoordinator) {
      const coord = newRaffle.initialCoordinator;
      if (coord.clearDemoSellers) {
        clearSimulationSellers();
      }

      if (coord.name && coord.name.trim()) {
        const stored = getStoredData();
        const existing = stored.sellers.find(
          (s) => s.name.toLowerCase().trim() === coord.name.toLowerCase().trim()
        );

        let sellerId = existing?.id;
        if (existing) {
          addOrUpdateSeller({
            ...existing,
            phone: coord.phone || existing.phone,
            role: coord.role || existing.role,
            pin: coord.pin || existing.pin || '1234',
            pixKey: coord.pixKey || existing.pixKey,
            targetNumbers: coord.targetNumbers || existing.targetNumbers || 25,
          });
        } else {
          const added = addOrUpdateSeller({
            name: coord.name.trim(),
            phone: coord.phone.trim() || '(88) 99999-9999',
            email: coord.email?.trim() || undefined,
            pixKey: coord.pixKey?.trim() || undefined,
            pin: coord.pin?.trim() || '1234',
            role: coord.role || 'admin',
            targetNumbers: coord.targetNumbers || 25,
          });
          sellerId = added.id;
        }

        if (sellerId) {
          handleSelectSeller(sellerId);
        }
      }
    }

    const created = createNewRaffle(newRaffle);
    setShowNewRaffleModal(false);

    // Auto-sync directly to connected Google Sheets Webhook without requiring manual user action
    const sheetsConfig = getSheetsConfig();
    if (sheetsConfig.webhookUrl) {
      showToast(`Criando aba e salvando "${created.title}" na Planilha Google Sheets...`, 'info');
      syncRaffleToGoogleSheets(created, 'FULL_SYNC')
        .then((res) => {
          if (res.success) {
            showToast(`Nova rifa "${created.title}" salva automaticamente na Planilha Google Sheets!`, 'success');
          } else {
            showToast(`Rifa criada! Status planilha: ${res.message}`, 'info');
          }
        })
        .catch((err) => {
          console.error('Erro ao salvar nova rifa diretamente no Google Sheets:', err);
          showToast(`Nova rifa "${created.title}" criada localmente.`, 'info');
        });
    } else {
      showToast(`Nova rifa "${created.title}" criada com sucesso!`, 'success');
    }
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
    triggerSheetsAutoSync(updated);
  };

  // Expand raffle total numbers (e.g. +10, +25, +50)
  const handleExpandRaffleNumbers = (additionalCount: number) => {
    if (!activeRaffle) return;
    const res = expandRaffleNumbers(activeRaffle.id, additionalCount);
    if (res.success) {
      showToast(res.message, 'success');
      triggerSheetsAutoSync(activeRaffle.id);
    }
  };

  // Select active raffle
  const handleSelectRaffle = (raffleId: string) => {
    setActiveRaffleId(raffleId);
    sounds.playPop();
    const found = data.raffles.find((r) => r.id === raffleId);
    if (found) {
      showToast(`Rifa ativa: "${found.title}"`, 'info');
    }
  };

  // Delete raffle (for admins)
  const handleDeleteRaffle = async (raffleId: string) => {
    const raffleToDelete = data.raffles.find((r) => r.id === raffleId);
    const raffleTitle = raffleToDelete?.title || '';

    const success = deleteRaffle(raffleId);
    if (success) {
      showToast(`Rifa "${raffleTitle || 'selecionada'}" excluída do sistema.`, 'info');

      // Also trigger deletion on connected Google Sheets if webhook is configured
      const config = getSheetsConfig();
      if (config.webhookUrl && raffleTitle) {
        showToast(`Removendo aba "${raffleTitle}" da planilha Google Sheets...`, 'info');
        const sheetRes = await deleteRaffleFromGoogleSheets(raffleTitle, raffleId);
        if (sheetRes.success) {
          showToast(sheetRes.message, 'success');
        } else {
          showToast(sheetRes.message, 'error');
        }
      }
    }
  };

  // Reset to default São José Operário demo
  const handleResetDemo = () => {
    if (confirm('Deseja restaurar os dados de exemplo da Rifa de São José Operário?')) {
      resetToInitialDemoData();
      sounds.playSuccess();
      setShowAuthModal(true);
      showToast('Dados restaurados com sucesso!');
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
        currentUser={currentUser}
        raffles={data.raffles}
        activeRaffleId={activeRaffle.id}
        onSelectRaffle={handleSelectRaffle}
        onDeleteRaffle={handleDeleteRaffle}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenNewRaffle={() => {
          if (!isAdmin) {
            setShowAuthModal(true);
            return;
          }
          setShowNewRaffleModal(true);
        }}
        onOpenRaffleManager={() => {
          if (!isAdmin) {
            setShowAuthModal(true);
            return;
          }
          setShowRaffleManagerModal(true);
        }}
        onOpenSellerManager={() => {
          if (!isAdmin) {
            setShowAuthModal(true);
            return;
          }
          setShowSellerModal(true);
        }}
        onOpenSheetsSync={() => setShowSheetsModal(true)}
        onResetDemo={handleResetDemo}
        activeRaffleTitle={activeRaffle.title}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8 w-full max-w-full overflow-x-hidden">
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
              onOpenExpandNumbers={() => {
                if (!isAdmin) {
                  setShowAuthModal(true);
                  return;
                }
                setShowExpandNumbersModal(true);
              }}
              onOpenEditRaffle={() => {
                if (!isAdmin) {
                  setShowAuthModal(true);
                  return;
                }
                setShowEditRaffleModal(true);
              }}
              onOpenNewRaffle={() => {
                if (!isAdmin) {
                  setShowAuthModal(true);
                  return;
                }
                setShowNewRaffleModal(true);
              }}
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
              onOpenExpandNumbers={() => {
                if (!isAdmin) {
                  setShowAuthModal(true);
                  return;
                }
                setShowExpandNumbersModal(true);
              }}
            />
          </div>
        )}

        {/* Tab 2: Balcão do Vendedor (Fast Sales Terminal & Personal Stats) */}
        {activeTab === 'seller' && (
          <div className="animate-fade-in">
            {!currentUser ? (
              <div className="w-full max-w-xl mx-auto px-4 py-12 text-center">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#eee4db] shadow-lg space-y-4 text-[#2d2a26]">
                  <div className="w-14 h-14 rounded-2xl bg-[#f0f4ee] border border-[#d1dec8] text-[#5A5A40] flex items-center justify-center mx-auto">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold font-serif">Acesso ao Balcão do Vendedor</h3>
                  <p className="text-xs sm:text-sm text-[#7c736a] leading-relaxed">
                    Identifique-se com seu PIN de vendedor ou coordenador para registrar vendas rápidas, confirmar pagamentos e emitir comprovantes.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="px-6 py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Fazer Login do Vendedor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('grid')}
                      className="px-4 py-3 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] active:scale-95"
                    >
                      Ver Grade de Bilhetes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <SellerDesk
                raffle={activeRaffle}
                sellers={sellers}
                currentSellerId={currentUser.id}
                isAdmin={isAdmin}
                onSelectSeller={handleSelectSeller}
                onConfirmPayment={handleConfirmPayment}
                onReleaseNumber={handleReleaseNumber}
                onRegisterSale={handleRegisterSale}
                onOpenReceipt={(numData) => setShowReceiptModal(numData)}
                onOpenSellerManager={() => setShowSellerModal(true)}
              />
            )}
          </div>
        )}

        {/* Tab 3: Controle Financeiro Total & Auditoria de Pagamentos */}
        {activeTab === 'finance' && (
          <div className="animate-fade-in">
            {!isAdmin ? (
              /* Informative Access Gate if non-admin attempts to access financial ledger */
              <div className="w-full max-w-xl mx-auto px-4 py-12 text-center">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#eee4db] shadow-lg space-y-4 text-[#2d2a26]">
                  <div className="w-14 h-14 rounded-2xl bg-[#fdf1eb] border border-[#f0c3b4] text-[#D48166] flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold font-serif">Área Restrita à Coordenação (ADM)</h3>
                  <p className="text-xs sm:text-sm text-[#7c736a] leading-relaxed">
                    O Controle Financeiro Geral, lançamento de despesas e aprovações em lote requerem login de <strong>Coordenador / Administrador</strong>.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="px-6 py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Fazer Login como Administrador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('seller')}
                      className="px-4 py-3 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] active:scale-95"
                    >
                      Ir para meu Balcão de Vendedor
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <FinancialDashboard
                raffle={activeRaffle}
                sellers={sellers}
                onConfirmPayment={handleConfirmPayment}
                onBulkConfirmPayments={handleBulkConfirmPayments}
                onReleaseNumber={handleReleaseNumber}
                onReleaseExpired={handleReleaseExpired}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                onOpenExpandNumbers={() => setShowExpandNumbersModal(true)}
                onOpenSellerManager={() => setShowSellerModal(true)}
              />
            )}
          </div>
        )}

        {/* Tab 4: Relatórios Automáticos & Prestação de Contas */}
        {activeTab === 'reports' && (
          <div className="animate-fade-in">
            <ReportsView
              raffle={activeRaffle}
              sellers={sellers}
              onOpenEditRaffle={() => {
                if (!isAdmin) {
                  setShowAuthModal(true);
                  return;
                }
                setShowEditRaffleModal(true);
              }}
              onOpenSheetsSync={() => setShowSheetsModal(true)}
            />
          </div>
        )}

        {/* Tab 5: Sorteador Ao Vivo & Roleta Eletrônica (Exclusivo para Coordenação / ADM) */}
        {activeTab === 'draw' && (
          <div className="animate-fade-in">
            {!isAdmin ? (
              <div className="w-full max-w-xl mx-auto px-4 py-12 text-center">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#eee4db] shadow-lg space-y-4 text-[#2d2a26]">
                  <div className="w-14 h-14 rounded-2xl bg-[#fdf1eb] border border-[#f0c3b4] text-[#D48166] flex items-center justify-center mx-auto">
                    <Gift className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold font-serif">Sorteador Restrito à Coordenação</h3>
                  <p className="text-xs sm:text-sm text-[#7c736a] leading-relaxed">
                    O Sorteador Oficial ao vivo é de uso exclusivo da <strong>Coordenação / Administrador</strong> da Rifa. Vendedores podem acompanhar as cotas no Balcão de Vendas.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="px-6 py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Entrar como Administrador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('grid')}
                      className="px-4 py-3 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] active:scale-95"
                    >
                      Voltar aos Bilhetes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <DrawModal
                raffle={activeRaffle}
                onClose={() => setActiveTab('grid')}
                onSaveWinner={handleSaveWinner}
              />
            )}
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

      {/* Auth / Login Modal for Sellers & Admins */}
      {isClientMounted && showAuthModal && (
        <AuthModal
          sellers={sellers}
          currentUser={currentUser}
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onEnterGuestMode={handleLogout}
        />
      )}

      {/* User Profile & Change PIN Modal */}
      {isClientMounted && showProfileModal && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdatePin={handleUpdatePin}
          onLogout={handleLogout}
          onSwitchUser={() => setShowAuthModal(true)}
          onOpenSellerManager={() => setShowSellerModal(true)}
          onOpenRaffleManager={() => setShowRaffleManagerModal(true)}
        />
      )}

      {/* Raffle List & Cleanup Manager Modal (Gerenciar & Apagar Rifas) */}
      {isClientMounted && showRaffleManagerModal && (
        <RaffleManagerModal
          isOpen={showRaffleManagerModal}
          onClose={() => setShowRaffleManagerModal(false)}
          raffles={data.raffles}
          activeRaffleId={activeRaffle.id}
          onSelectRaffle={handleSelectRaffle}
          onDeleteRaffle={handleDeleteRaffle}
          onOpenNewRaffle={() => {
            setShowRaffleManagerModal(false);
            setShowNewRaffleModal(true);
          }}
          onOpenEditRaffle={() => {
            setShowRaffleManagerModal(false);
            setShowEditRaffleModal(true);
          }}
        />
      )}

      {/* Buyer Checkout Modal */}
      {isClientMounted && showCheckoutModal && (
        <BuyerCheckoutModal
          raffle={activeRaffle}
          selectedNumbers={selectedNumbers}
          sellers={sellers}
          defaultSellerId={currentUser?.id || sellers[0]?.id}
          isSellerOrAdmin={Boolean(currentUser)}
          onClose={() => setShowCheckoutModal(false)}
          onConfirm={handleCheckoutConfirm}
        />
      )}

      {/* Digital Receipt / Ticket Modal */}
      {isClientMounted && showReceiptModal && (
        <DigitalReceiptModal
          raffle={activeRaffle}
          numberData={showReceiptModal}
          onClose={() => setShowReceiptModal(null)}
          onReleaseNumber={handleReleaseNumber}
          onConfirmPayment={handleConfirmPayment}
          isSellerOrAdmin={Boolean(currentUser)}
        />
      )}

      {/* Seller Manager Modal (Equipe) */}
      {isClientMounted && showSellerModal && (
        <SellerManagerModal
          sellers={sellers}
          onClose={() => setShowSellerModal(false)}
          onSaveSeller={handleSaveSeller}
          onDeleteSeller={handleDeleteSeller}
          onClearSimulationSellers={() => {
            const count = clearSimulationSellers();
            showToast(`${count} vendedores de simulação removidos com sucesso!`, 'info');
          }}
        />
      )}

      {/* New Raffle Creation Modal (Iniciar Nova Nota) */}
      {isClientMounted && showNewRaffleModal && (
        <RaffleSettingsModal
          isNew={true}
          onClose={() => setShowNewRaffleModal(false)}
          onSave={handleCreateRaffle}
        />
      )}

      {/* Edit Raffle Modal (Editar Nota & Prêmios da Rifa Atual) */}
      {isClientMounted && showEditRaffleModal && (
        <RaffleSettingsModal
          raffle={activeRaffle}
          isNew={false}
          onClose={() => setShowEditRaffleModal(false)}
          onSave={handleUpdateRaffle}
        />
      )}

      {/* Raffle Details & Regulation Modal */}
      {isClientMounted && showDetailsModal && (
        <RaffleDetailsModal
          raffle={activeRaffle}
          onClose={() => setShowDetailsModal(false)}
          onOpenEdit={() => {
            if (!isAdmin) {
              setShowAuthModal(true);
              return;
            }
            setShowDetailsModal(false);
            setShowEditRaffleModal(true);
          }}
        />
      )}

      {/* Expand Numbers Modal (Aumentar Quantidade de Cotas da Rifa) */}
      {isClientMounted && showExpandNumbersModal && activeRaffle && (
        <ExpandNumbersModal
          raffle={activeRaffle}
          isOpen={showExpandNumbersModal}
          onClose={() => setShowExpandNumbersModal(false)}
          onExpand={handleExpandRaffleNumbers}
        />
      )}

      {/* Google Sheets Sync Modal */}
      {isClientMounted && showSheetsModal && activeRaffle && (
        <GoogleSheetsSyncModal
          raffle={activeRaffle}
          isOpen={showSheetsModal}
          onClose={() => setShowSheetsModal(false)}
          onSyncSuccess={(msg) => showToast(msg, 'success')}
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
          Sistema de Rifas Beneficentes com Autenticação de Vendedores e Administração Integrada
        </p>
      </footer>

      {/* Floating System Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-100 max-w-sm w-full animate-slide-up pointer-events-none px-4 sm:px-0">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md pointer-events-auto ${
              toastMessage.type === 'success'
                ? 'bg-[#e8f5e9]/95 text-[#1e7e34] border-[#a5d6a7]'
                : toastMessage.type === 'error'
                ? 'bg-[#ffebee]/95 text-[#c62828] border-[#ef9a9a]'
                : 'bg-[#f8f5f0]/95 text-[#423d38] border-[#d7ccc8]'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-[#1e7e34]" />}
            {toastMessage.type === 'error' && <ShieldAlert className="w-5 h-5 shrink-0 text-[#c62828]" />}
            {toastMessage.type === 'info' && <RefreshCw className="w-5 h-5 shrink-0 text-[#5A5A40]" />}
            <span className="text-xs font-bold leading-tight">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
