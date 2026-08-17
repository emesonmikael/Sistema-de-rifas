'use client';

import React, { useState, useMemo } from 'react';
import { Raffle, RaffleNumber } from '@/types/raffle';
import { formatCurrency } from '@/lib/pix';
import { sounds } from '@/lib/sound';
import { Search, Sparkles, CheckCircle2, Clock, XCircle, ShoppingCart, RefreshCw, Eye } from 'lucide-react';

interface RaffleGridProps {
  raffle: Raffle;
  selectedNumbers: number[];
  onToggleNumber: (num: number) => void;
  onSelectMultiple: (nums: number[]) => void;
  onClearSelection: () => void;
  onOpenCheckout: () => void;
  onInspectNumber?: (numberData: RaffleNumber) => void;
}

export const RaffleGrid: React.FC<RaffleGridProps> = ({
  raffle,
  selectedNumbers,
  onToggleNumber,
  onSelectMultiple,
  onClearSelection,
  onOpenCheckout,
  onInspectNumber,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'reserved' | 'paid' | 'selected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const numberList = useMemo(() => {
    const list: RaffleNumber[] = [];
    for (let i = 1; i <= raffle.totalNumbers; i++) {
      list.push(raffle.numbers[i] || { number: i, status: 'available' });
    }
    return list;
  }, [raffle.numbers, raffle.totalNumbers]);

  const filteredNumbers = useMemo(() => {
    return numberList.filter((item) => {
      const isSelected = selectedNumbers.includes(item.number);

      // Status filter
      if (filterStatus === 'available' && item.status !== 'available') return false;
      if (filterStatus === 'reserved' && item.status !== 'reserved') return false;
      if (filterStatus === 'paid' && item.status !== 'paid') return false;
      if (filterStatus === 'selected' && !isSelected) return false;

      // Search filter (number or buyer name or phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const numStr = item.number.toString();
        const numPad = item.number.toString().padStart(2, '0');
        const buyer = (item.buyerName || '').toLowerCase();
        const phone = (item.buyerPhone || '').toLowerCase();
        const seller = (item.sellerName || '').toLowerCase();

        return (
          numStr.includes(query) ||
          numPad.includes(query) ||
          buyer.includes(query) ||
          phone.includes(query) ||
          seller.includes(query)
        );
      }

      return true;
    });
  }, [numberList, filterStatus, searchQuery, selectedNumbers]);

  // Quick Random Pickers (Surpresinha)
  const handlePickRandom = (count: number) => {
    const available = numberList.filter((n) => n.status === 'available' && !selectedNumbers.includes(n.number));
    if (available.length === 0) return;

    // Shuffle
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count).map((n) => n.number);

    sounds.playPop();
    onSelectMultiple([...selectedNumbers, ...picked]);
  };

  const totalSelectedPrice = selectedNumbers.length * raffle.pricePerNumber;

  // Natural Tones palette for badges
  const getNumberColorClass = (num: number, status: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-[#D48166] text-white border-[#b35c43] ring-4 ring-[#f0c3b4] shadow-md scale-105 z-10';
    }
    if (status === 'paid') {
      return 'bg-[#5A5A40] text-white border-[#484832] opacity-95 cursor-default';
    }
    if (status === 'reserved') {
      return 'bg-[#fdf1eb] text-[#D48166] border-[#f0c3b4] ring-2 ring-[#fbe7df]';
    }

    // Available Natural Tones: clean white card with warm borders
    return 'bg-white text-[#2d2a26] border-[#eee4db] hover:border-[#5A5A40] hover:bg-[#fdfaf7] shadow-xs';
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pb-28">
      {/* Title Bar for Grid */}
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-black text-[#2d2a26] font-serif uppercase tracking-tight flex items-center justify-center gap-2">
          <span>ESCOLHA SEU NÚMERO (01 A {raffle.totalNumbers.toString().padStart(2, '0')})</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#7c736a] mt-1">
          Clique nos números disponíveis para marcar e garantir sua participação!
        </p>
      </div>

      {/* Control Bar: Filters, Search, Random Pick */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#eee4db] mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-[#f8f5f0] text-[#7c736a] hover:bg-[#eee4db]'
              }`}
            >
              Todos ({raffle.totalNumbers})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'available'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-[#f0f4ee] text-[#3d4b3d] border border-[#d1dec8] hover:bg-[#e4ede1]'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-[#5A5A40]" />
              Livres ({numberList.filter((n) => n.status === 'available').length})
            </button>
            <button
              onClick={() => setFilterStatus('reserved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'reserved'
                  ? 'bg-[#D48166] text-white shadow-xs'
                  : 'bg-[#fdf1eb] text-[#D48166] border border-[#f0c3b4] hover:bg-[#fae4da]'
              }`}
            >
              <Clock className="w-3 h-3 text-[#D48166]" />
              Reservados ({numberList.filter((n) => n.status === 'reserved').length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                filterStatus === 'paid'
                  ? 'bg-[#484832] text-white shadow-xs'
                  : 'bg-[#f8f5f0] text-[#423d38] border border-[#eee4db] hover:bg-[#ede6df]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-[#5A5A40]" />
              Pagos ({numberList.filter((n) => n.status === 'paid').length})
            </button>
            {selectedNumbers.length > 0 && (
              <button
                onClick={() => setFilterStatus('selected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                  filterStatus === 'selected'
                    ? 'bg-[#D48166] text-white shadow-xs'
                    : 'bg-[#fdf1eb] text-[#D48166] border border-[#f0c3b4] hover:bg-[#fae4da]'
                }`}
              >
                <ShoppingCart className="w-3 h-3 text-[#D48166]" />
                Meus ({selectedNumbers.length})
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#a89d91] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar número ou comprador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-[#2d2a26]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a89d91] hover:text-[#423d38]"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Picker Bar */}
        <div className="pt-2 border-t border-[#eee4db] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[#7c736a] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D48166]" />
              Surpresinha (Aleatório):
            </span>
            <button
              onClick={() => handlePickRandom(1)}
              className="px-2.5 py-1 bg-[#fdf1eb] hover:bg-[#fae4da] text-[#D48166] rounded-lg font-bold transition-colors"
            >
              +1 Cota
            </button>
            <button
              onClick={() => handlePickRandom(3)}
              className="px-2.5 py-1 bg-[#fdf1eb] hover:bg-[#fae4da] text-[#D48166] rounded-lg font-bold transition-colors"
            >
              +3 Cotas
            </button>
            <button
              onClick={() => handlePickRandom(5)}
              className="px-2.5 py-1 bg-[#fdf1eb] hover:bg-[#fae4da] text-[#D48166] rounded-lg font-bold transition-colors"
            >
              +5 Cotas
            </button>
            <button
              onClick={() => handlePickRandom(10)}
              className="px-2.5 py-1 bg-[#fdf1eb] hover:bg-[#fae4da] text-[#D48166] rounded-lg font-bold transition-colors"
            >
              +10 Cotas
            </button>
          </div>

          {selectedNumbers.length > 0 && (
            <button
              onClick={onClearSelection}
              className="text-[#D48166] hover:text-[#b35c43] font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Limpar Seleção
            </button>
          )}
        </div>
      </div>

      {/* The Visual Grid matching Natural Tones aesthetic */}
      <div className="bg-[#f8f5f0] p-4 sm:p-6 rounded-3xl border-2 border-[#eee4db] shadow-md">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3">
          {filteredNumbers.map((item) => {
            const isSelected = selectedNumbers.includes(item.number);
            const isPaid = item.status === 'paid';
            const isReserved = item.status === 'reserved';
            const isAvailable = item.status === 'available';

            return (
              <button
                key={item.number}
                type="button"
                onClick={() => {
                  if (isAvailable || isSelected) {
                    sounds.playPop();
                    onToggleNumber(item.number);
                  } else if (onInspectNumber) {
                    onInspectNumber(item);
                  }
                }}
                className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center p-1 transition-all duration-200 border-2 font-bold select-none cursor-pointer ${getNumberColorClass(
                  item.number,
                  item.status,
                  isSelected
                )}`}
              >
                {/* Number */}
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight leading-none">
                  {item.number.toString().padStart(2, '0')}
                </span>

                {/* Status Badges on the Card */}
                {isPaid && (
                  <div className="mt-0.5 flex flex-col items-center w-full">
                    <span className="text-[9px] sm:text-[10px] bg-[#484832] text-white font-extrabold px-1 rounded uppercase tracking-wider">
                      PAGO
                    </span>
                    {item.buyerName && (
                      <span className="text-[8px] truncate max-w-full text-[#dcd5cc] font-normal px-0.5 mt-0.5">
                        {item.buyerName.split(' ')[0]}
                      </span>
                    )}
                  </div>
                )}

                {isReserved && (
                  <div className="mt-0.5 flex flex-col items-center w-full">
                    <span className="text-[8px] sm:text-[9px] bg-[#D48166] text-white font-bold px-1 rounded uppercase">
                      RESERVA
                    </span>
                    {item.buyerName && (
                      <span className="text-[8px] truncate max-w-full text-[#b35c43] font-medium px-0.5 mt-0.5">
                        {item.buyerName.split(' ')[0]}
                      </span>
                    )}
                  </div>
                )}

                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-white text-[#D48166] rounded-full flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Inspect tooltip icon for reserved/paid numbers */}
                {!isAvailable && (
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3 h-3 text-[#a89d91]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredNumbers.length === 0 && (
          <div className="py-12 text-center text-[#7c736a]">
            <p className="text-sm font-medium">Nenhum número encontrado com o filtro atual.</p>
            <button
              onClick={() => {
                setFilterStatus('all');
                setSearchQuery('');
              }}
              className="mt-2 text-xs font-bold text-[#D48166] hover:underline"
            >
              Ver todos os números
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-[#eee4db] flex flex-wrap items-center justify-center gap-4 text-xs text-[#7c736a]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-white border border-[#eee4db] font-mono text-[10px] flex items-center justify-center text-[#2d2a26] font-bold">
              01
            </div>
            <span>Disponível</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-[#D48166] text-white font-mono text-[10px] flex items-center justify-center font-bold">
              ✓
            </div>
            <span>Selecionado</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-[#fdf1eb] border border-[#f0c3b4] text-[#D48166] font-mono text-[10px] flex items-center justify-center font-bold">
              ⏳
            </div>
            <span>Reservado</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-[#5A5A40] text-white font-mono text-[10px] flex items-center justify-center font-bold">
              ✓
            </div>
            <span>Pago / Confirmado</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Drawer for Instant Checkout when 1 or more numbers are selected */}
      {selectedNumbers.length > 0 && (
        <div className="fixed bottom-3 inset-x-3 max-w-3xl mx-auto z-40 animate-slide-up">
          <div className="bg-[#2d2a26] text-white p-4 rounded-2xl shadow-2xl border-2 border-[#5A5A40] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-xl bg-[#D48166] text-white flex flex-col items-center justify-center shrink-0 font-bold shadow-xs">
                <span className="text-lg leading-none">{selectedNumbers.length}</span>
                <span className="text-[9px] uppercase">Cota{selectedNumbers.length > 1 ? 's' : ''}</span>
              </div>
              <div>
                <div className="text-xs text-[#a89d91]">Números marcados:</div>
                <div className="text-xs font-mono font-bold text-[#fdfaf7] truncate max-w-[200px] sm:max-w-xs">
                  {selectedNumbers.sort((a, b) => a - b).map((n) => n.toString().padStart(2, '0')).join(', ')}
                </div>
                <div className="text-base font-black text-[#D48166]">
                  Total: {formatCurrency(totalSelectedPrice)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={onClearSelection}
                className="px-3 py-2 text-xs text-[#a89d91] hover:text-white transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={() => {
                  sounds.playSuccess();
                  onOpenCheckout();
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#D48166] hover:bg-[#c27055] text-white font-black text-sm rounded-xl shadow-md transition-transform active:scale-95 whitespace-nowrap"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Finalizar Compra / PIX</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
