'use client';

import React from 'react';
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
  User,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { Seller } from '@/types/raffle';

interface NavbarProps {
  activeTab: 'grid' | 'seller' | 'finance' | 'reports' | 'draw';
  setActiveTab: (tab: 'grid' | 'seller' | 'finance' | 'reports' | 'draw') => void;
  sellers: Seller[];
  currentUser: Seller | null;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onOpenNewRaffle: () => void;
  onOpenSellerManager: () => void;
  onResetDemo: () => void;
  activeRaffleTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sellers,
  currentUser,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenNewRaffle,
  onOpenSellerManager,
  onResetDemo,
  activeRaffleTitle,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-[#423d38] border-b border-[#eee4db] shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#5A5A40] flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-xs shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#fdfaf7]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-base sm:text-lg text-[#2d2a26]">RifaPix</span>
                <span className="text-[10px] sm:text-xs bg-[#e8f0e8] text-[#3d4b3d] border border-[#d1dec8] px-1.5 py-0.2 rounded-full font-medium hidden sm:inline-block">
                  Paroquial
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#7c736a] truncate max-w-[120px] sm:max-w-[240px]">
                {activeRaffleTitle}
              </p>
            </div>
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
                <span>Entrar (Vendedor/ADM)</span>
              </button>
            )}

            {/* Team Manager Button (Always available for admin or fast switch) */}
            <button
              type="button"
              onClick={onOpenSellerManager}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] rounded-lg text-xs font-semibold border border-[#eee4db] transition-colors active:scale-95"
              title="Gerenciar equipe de vendedores"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Equipe</span>
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
              title="Restaurar dados de exemplo da Rifa de São José Operário"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Friendly with minimum 48px touch targets) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#eee4db] shadow-lg pb-safe">
        <div className="grid grid-cols-5 h-14 items-center justify-around px-1">
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
        </div>
      </nav>
    </>
  );
};
