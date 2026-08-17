'use client';

import React from 'react';
import { Grid, DollarSign, FileText, Gift, UserCheck, Plus, RotateCcw, Award } from 'lucide-react';
import { Seller } from '@/types/raffle';

interface NavbarProps {
  activeTab: 'grid' | 'seller' | 'finance' | 'reports' | 'draw';
  setActiveTab: (tab: 'grid' | 'seller' | 'finance' | 'reports' | 'draw') => void;
  sellers: Seller[];
  currentSellerId?: string;
  onSelectSeller: (sellerId: string) => void;
  onOpenNewRaffle: () => void;
  onOpenSellerManager: () => void;
  onResetDemo: () => void;
  activeRaffleTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sellers,
  currentSellerId,
  onSelectSeller,
  onOpenNewRaffle,
  onOpenSellerManager,
  onResetDemo,
  activeRaffleTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white text-[#423d38] border-b border-[#eee4db] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#5A5A40] flex items-center justify-center text-white font-black text-xl shadow-xs">
            <Award className="w-5 h-5 text-[#fdfaf7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-lg text-[#2d2a26]">RifaPix</span>
              <span className="text-xs bg-[#e8f0e8] text-[#3d4b3d] border border-[#d1dec8] px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
                Paroquial & Beneficente
              </span>
            </div>
            <p className="text-xs text-[#7c736a] truncate max-w-[200px] sm:max-w-[280px]">
              {activeRaffleTitle}
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#f8f5f0] p-1 rounded-xl border border-[#eee4db]">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'grid'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#ede6df]'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Grade & Bilhetes</span>
          </button>

          <button
            onClick={() => setActiveTab('seller')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'seller'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#ede6df]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Balcão do Vendedor</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'finance'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#ede6df]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Controle Financeiro</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#ede6df]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Relatórios & Prestação</span>
          </button>

          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'draw'
                ? 'bg-[#D48166] text-white font-bold shadow-xs'
                : 'text-[#D48166] hover:bg-[#fdf1eb]'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Sorteador Ao Vivo</span>
          </button>
        </nav>

        {/* Zone 3: Actions & Seller Selector */}
        <div className="flex items-center gap-2">
          {/* Active Seller Switcher */}
          <div className="hidden lg:flex items-center gap-2 bg-[#f8f5f0] px-2.5 py-1 rounded-lg border border-[#eee4db] text-xs">
            <span className="text-[#7c736a]">Vendedor:</span>
            <select
              value={currentSellerId || ''}
              onChange={(e) => onSelectSeller(e.target.value)}
              className="bg-transparent text-[#2d2a26] font-medium focus:outline-none cursor-pointer text-xs"
            >
              {sellers.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-[#2d2a26]">
                  {s.name} {s.role === 'admin' ? '⭐ (Coord.)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenSellerManager}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] rounded-lg text-xs font-semibold border border-[#eee4db] transition-colors"
            title="Gerenciar equipe de vendedores"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Equipe</span>
          </button>

          <button
            onClick={onOpenNewRaffle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D48166] hover:bg-[#c27055] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Nova Rifa</span>
            <span className="sm:hidden">Nova</span>
          </button>

          <button
            onClick={onResetDemo}
            className="p-1.5 text-[#7c736a] hover:text-[#2d2a26] hover:bg-[#f8f5f0] rounded-lg transition-colors"
            title="Restaurar dados de exemplo da Rifa de São José Operário"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#eee4db] bg-white py-2 px-1 text-xs">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
            activeTab === 'grid' ? 'text-[#5A5A40] font-bold' : 'text-[#7c736a]'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Bilhetes</span>
        </button>

        <button
          onClick={() => setActiveTab('seller')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
            activeTab === 'seller' ? 'text-[#5A5A40] font-bold' : 'text-[#7c736a]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Vender</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
            activeTab === 'finance' ? 'text-[#5A5A40] font-bold' : 'text-[#7c736a]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financeiro</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
            activeTab === 'reports' ? 'text-[#5A5A40] font-bold' : 'text-[#7c736a]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Relatórios</span>
        </button>

        <button
          onClick={() => setActiveTab('draw')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-md ${
            activeTab === 'draw' ? 'text-[#D48166] font-bold' : 'text-[#D48166]/70'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Sorteio</span>
        </button>
      </div>
    </header>
  );
};
