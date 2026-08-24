'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Grid,
  DollarSign,
  FileText,
  Gift,
  UserCheck,
  Plus,
  RotateCcw,
  Award,
  Lock,
  ChevronDown,
  Check,
  Trash2,
  LogIn,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Raffle, Seller } from '@/types/raffle';

interface NavbarProps {
  activeTab: 'grid' | 'seller' | 'finance' | 'reports' | 'draw';
  setActiveTab: (tab: 'grid' | 'seller' | 'finance' | 'reports' | 'draw') => void;
  sellers: Seller[];
  currentUser: Seller | null;
  raffles: Raffle[];
  activeRaffleId: string;
  onSelectRaffle: (raffleId: string) => void;
  onDeleteRaffle?: (raffleId: string) => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenNewRaffle: () => void;
  onOpenSellerManager: () => void;
  onOpenSheetsSync: () => void;
  onResetDemo: () => void;
  activeRaffleTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sellers,
  currentUser,
  raffles,
  activeRaffleId,
  onSelectRaffle,
  onDeleteRaffle,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenNewRaffle,
  onOpenSellerManager,
  onOpenSheetsSync,
  onResetDemo,
  activeRaffleTitle,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [showRaffleDropdown, setShowRaffleDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRaffleDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-[#423d38] border-b border-[#eee4db] shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand Title & Raffle Switcher Dropdown */}
          <div className="relative flex items-center gap-2 sm:gap-3 shrink-0 min-w-0" ref={dropdownRef}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#5A5A40] flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-xs shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#fdfaf7]" />
            </div>

            {/* Interactive Raffle Selector Trigger */}
            <button
              type="button"
              onClick={() => setShowRaffleDropdown(!showRaffleDropdown)}
              className="text-left group flex items-center gap-1.5 p-1 rounded-xl hover:bg-[#f8f5f0] transition-all max-w-[140px] sm:max-w-[240px] md:max-w-[280px]"
              title="Clique para alternar ou gerenciar rifas"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black tracking-tight text-sm sm:text-base text-[#2d2a26] leading-none">
                    RifaPix
                  </span>
                  {raffles.length > 1 && (
                    <span className="text-[9px] bg-[#e8f0e8] text-[#1e7e34] border border-[#c8e6c9] px-1.5 py-0.2 rounded-full font-bold">
                      {raffles.length} rifas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[11px] sm:text-xs font-semibold text-[#7c736a] group-hover:text-[#2d2a26] truncate">
                    {activeRaffleTitle}
                  </p>
                  <ChevronDown className="w-3 h-3 text-[#7c736a] shrink-0 group-hover:text-[#2d2a26]" />
                </div>
              </div>
            </button>

            {/* Dropdown Menu to Switch Between Created Raffles */}
            {showRaffleDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-[#eee4db] shadow-xl p-2 z-50 animate-fade-in text-[#2d2a26]">
                <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#eee4db] text-xs font-bold text-[#7c736a] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#5A5A40]" />
                    <span>Minhas Rifas ({raffles.length})</span>
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRaffleDropdown(false);
                        onOpenNewRaffle();
                      }}
                      className="text-[#D48166] hover:underline font-extrabold flex items-center gap-0.5 lowercase text-[11px]"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>nova</span>
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto py-1 space-y-1">
                  {raffles.map((raf) => {
                    const isSelected = raf.id === activeRaffleId;
                    const paidCount = Object.values(raf.numbers).filter((n) => n.status === 'paid').length;
                    return (
                      <div
                        key={raf.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#f0f4ee] border border-[#d1dec8]'
                            : 'hover:bg-[#f8f5f0] border border-transparent'
                        }`}
                        onClick={() => {
                          onSelectRaffle(raf.id);
                          setShowRaffleDropdown(false);
                        }}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-[#2d2a26] truncate">
                              {raf.title}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] bg-[#5A5A40] text-white px-1.5 py-0.2 rounded font-black shrink-0">
                                Ativa
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-[#7c736a] truncate">
                            {raf.chapelOrOrgName} • R$ {raf.pricePerNumber},00 • {paidCount}/{raf.totalNumbers} pagas
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && <Check className="w-4 h-4 text-[#5A5A40]" />}
                          {isAdmin && raffles.length > 1 && onDeleteRaffle && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Deseja realmente excluir a rifa "${raf.title}"?`)) {
                                  onDeleteRaffle(raf.id);
                                }
                              }}
                              className="p-1 text-[#a89d91] hover:text-red-600 rounded hover:bg-red-50"
                              title="Excluir rifa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isAdmin ? (
                  <div className="pt-2 border-t border-[#eee4db] space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRaffleDropdown(false);
                        onOpenNewRaffle();
                      }}
                      className="w-full py-2 bg-[#D48166] hover:bg-[#c27055] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Criar Nova Rifa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRaffleDropdown(false);
                        onOpenSellerManager();
                      }}
                      className="w-full py-1.5 bg-[#f0f4ee] hover:bg-[#e4ecdf] text-[#5A5A40] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-[#d1dec8]"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#5A5A40]" />
                      <span>Cadastrar / Gerenciar Vendedores</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#eee4db] text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRaffleDropdown(false);
                        onOpenAuthModal();
                      }}
                      className="text-[11px] text-[#5A5A40] font-bold hover:underline"
                    >
                      Entrar como Administrador para criar nova rifa
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f8f5f0] p-1 rounded-xl border border-[#eee4db]">
            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap active:scale-95 ${
                activeTab === 'grid'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#ede6df]'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Grade & Bilhetes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('seller')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap active:scale-95 ${
                activeTab === 'seller'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#ede6df]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Balcão do Vendedor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap active:scale-95 ${
                activeTab === 'finance'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#ede6df]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Controle Financeiro</span>
              {!isAdmin && (
                <span className="text-[9px] bg-[#eee4db] text-[#7c736a] px-1.5 py-0.2 rounded font-bold">
                  Admin
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap active:scale-95 ${
                activeTab === 'reports'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#ede6df]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Relatórios & Prestação</span>
            </button>

            {/* Sorteador Ao Vivo - EXCLUSIVO PARA ADMINISTRADOR */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('draw')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap active:scale-95 ${
                  activeTab === 'draw'
                    ? 'bg-[#D48166] text-white font-bold shadow-xs'
                    : 'text-[#D48166] hover:bg-[#fdf1eb]'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Sorteador Ao Vivo</span>
              </button>
            )}
          </nav>

          {/* Zone 3: User Auth / Profile Badge & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Authenticated User Button / Login Trigger */}
            {currentUser ? (
              <button
                type="button"
                onClick={onOpenProfileModal}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[#f8f5f0] hover:bg-[#eee4db] rounded-xl border border-[#eee4db] text-xs transition-all active:scale-95"
                title="Abrir Meu Perfil / Trocar PIN"
              >
                <div
                  className={`w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${
                    isAdmin ? 'bg-[#5A5A40]' : 'bg-[#D48166]'
                  }`}
                >
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block max-w-[110px] truncate">
                  <span className="font-bold text-[#2d2a26] block truncate leading-tight">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase ${
                      isAdmin ? 'text-[#5A5A40]' : 'text-[#D48166]'
                    }`}
                  >
                    {isAdmin ? '👑 Coordenação' : '🤝 Vendedor'}
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5A5A40] hover:bg-[#484832] text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {/* Google Sheets Sync Button */}
            <button
              type="button"
              onClick={onOpenSheetsSync}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f0f9f1] hover:bg-[#e1f3e3] text-[#1e7e34] border border-[#c8e6c9] rounded-lg text-xs font-bold transition-all active:scale-95 shadow-2xs shrink-0"
              title="Sincronizar com Planilha Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Planilha Sheets</span>
            </button>

            {/* Team Manager Button */}
            <button
              type="button"
              onClick={onOpenSellerManager}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] rounded-xl text-xs font-bold border border-[#eee4db] transition-colors active:scale-95 shrink-0"
              title="Cadastrar e gerenciar equipe de vendedores"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span className="hidden xs:inline sm:inline">Equipe</span>
            </button>

            {/* New Raffle button for admins */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenNewRaffle}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-[#D48166] hover:bg-[#c27055] text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Nova Rifa</span>
              </button>
            )}

            {/* Fast Switch User Icon */}
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="p-1.5 text-[#7c736a] hover:text-[#5A5A40] hover:bg-[#f8f5f0] rounded-lg transition-colors active:scale-95 shrink-0"
              title="Alternar login de Vendedor ou Administrador"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Reset Demo button */}
            <button
              type="button"
              onClick={onResetDemo}
              className="p-1.5 text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#f8f5f0] rounded-lg transition-colors active:scale-95 shrink-0"
              title="Restaurar dados de exemplo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (4 columns for Sellers, 5 columns for Admin) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#eee4db] shadow-lg pb-safe">
        <div className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} h-14 items-center justify-around px-1`}>
          <button
            type="button"
            onClick={() => setActiveTab('grid')}
            className={`flex flex-col items-center justify-center h-full py-1 active:scale-95 transition-transform ${
              activeTab === 'grid' ? 'text-[#5A5A40] font-bold' : 'text-[#7c736a]'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'grid' ? 'bg-[#f0f4ee]' : ''}`}>
              <Grid className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5">Bilhetes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seller')}
            className={`flex flex-col items-center justify-center h-full py-1 active:scale-95 transition-transform ${
              activeTab === 'seller' ? 'text-[#5A5A40] font-bold' : 'text-[#7c736a]'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'seller' ? 'bg-[#f0f4ee]' : ''}`}>
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5">Vender</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`flex flex-col items-center justify-center h-full py-1 active:scale-95 transition-transform ${
              activeTab === 'finance' ? 'text-[#5A5A40] font-bold' : 'text-[#7c736a]'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'finance' ? 'bg-[#f0f4ee]' : ''}`}>
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5">Financeiro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center h-full py-1 active:scale-95 transition-transform ${
              activeTab === 'reports' ? 'text-[#5A5A40] font-bold' : 'text-[#7c736a]'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'reports' ? 'bg-[#f0f4ee]' : ''}`}>
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5">Relatórios</span>
          </button>

          {/* Sorteio visible ONLY for Admin on Mobile */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`flex flex-col items-center justify-center h-full py-1 active:scale-95 transition-transform ${
                activeTab === 'draw' ? 'text-[#D48166] font-bold' : 'text-[#D48166]/70'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'draw' ? 'bg-[#fdf1eb]' : ''}`}>
                <Gift className="w-4 h-4" />
              </div>
              <span className="text-[10px] leading-tight mt-0.5">Sorteio</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
