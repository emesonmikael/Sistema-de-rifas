'use client';

import React, { useState } from 'react';
import { Raffle } from '@/types/raffle';
import { formatCurrency } from '@/lib/pix';
import { sounds } from '@/lib/sound';
import { Layers, Plus, ArrowRight, X, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface ExpandNumbersModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
  onExpand: (additionalCount: number) => void;
}

export const ExpandNumbersModal: React.FC<ExpandNumbersModalProps> = ({
  raffle,
  isOpen,
  onClose,
  onExpand,
}) => {
  const [additionalCount, setAdditionalCount] = useState<number>(50);
  const [customInput, setCustomInput] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTotal = raffle.totalNumbers;
  const countToAdd = useCustom ? (parseInt(customInput, 10) || 0) : additionalCount;
  const newTotal = currentTotal + countToAdd;

  const currentGrossGoal = currentTotal * raffle.pricePerNumber;
  const additionalGross = countToAdd * raffle.pricePerNumber;
  const newGrossGoal = newTotal * raffle.pricePerNumber;

  const handleConfirm = () => {
    if (countToAdd <= 0) {
      alert('Por favor, selecione ou digite uma quantidade válida de cotas para adicionar.');
      return;
    }
    sounds.playSuccess();
    onExpand(countToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26] flex flex-col">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#484832]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#484832] flex items-center justify-center font-bold text-white shadow-xs border border-white/20">
              <Layers className="w-6 h-6 text-[#fdfaf7]" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold bg-[#484832] text-[#fdfaf7] px-2.5 py-0.5 rounded-full border border-white/20">
                Expansão de Grade
              </span>
              <h2 className="text-xl font-black text-white font-serif tracking-tight mt-0.5">
                Aumentar Cotas da Rifa
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Explanation Banner */}
          <div className="p-4 bg-[#f0f4ee] rounded-2xl border border-[#d1dec8] space-y-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#5A5A40] shrink-0 mt-0.5" />
              <div className="text-xs text-[#3d4b3d] leading-relaxed">
                <strong className="block text-sm font-bold text-[#2d2a26] mb-0.5">
                  Todas as vendas e reservas atuais continuam 100% seguras!
                </strong>
                Ao adicionar novas cotas, os números já vendidos e reservados aos compradores permanecem intocados. Os novos números serão criados imediatamente como <strong>Disponíveis</strong> na grade para novas vendas.
              </div>
            </div>
          </div>

          {/* Current vs New Total Overview */}
          <div className="grid grid-cols-2 gap-3 bg-[#f8f5f0] p-4 rounded-2xl border border-[#eee4db] text-center">
            <div>
              <span className="text-[11px] font-bold text-[#7c736a] uppercase">Cotas Atuais</span>
              <div className="text-2xl font-black font-mono text-[#423d38] mt-0.5">
                {currentTotal}
              </div>
              <span className="text-[10px] text-[#7c736a]">
                01 a {currentTotal.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="border-l border-[#eee4db] pl-3">
              <span className="text-[11px] font-bold text-[#5A5A40] uppercase">Novo Total Previsto</span>
              <div className="text-2xl font-black font-mono text-[#5A5A40] mt-0.5 flex items-center justify-center gap-1">
                <span>{newTotal}</span>
                {countToAdd > 0 && (
                  <span className="text-xs bg-[#5A5A40] text-white px-1.5 py-0.5 rounded-full font-sans font-bold">
                    +{countToAdd}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#5A5A40] font-semibold">
                01 a {newTotal.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Quick Select Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-[#423d38] uppercase mb-2">
              Quantas cotas a mais você deseja adicionar?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setUseCustom(false);
                    setAdditionalCount(count);
                    sounds.playPop();
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    !useCustom && additionalCount === count
                      ? 'bg-[#5A5A40] text-white border-[#484832] shadow-xs scale-[1.02]'
                      : 'bg-white text-[#423d38] border-[#eee4db] hover:bg-[#f8f5f0]'
                  }`}
                >
                  +{count} cotas
                </button>
              ))}
            </div>

            {/* Custom Input Option */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setUseCustom(!useCustom);
                  if (!useCustom) {
                    setCustomInput('20');
                  }
                }}
                className="text-xs text-[#D48166] hover:text-[#b35c43] font-bold underline mb-2 block"
              >
                {useCustom ? '← Escolher valores pré-definidos' : 'Ou digitar outra quantidade personalizada...'}
              </button>

              {useCustom && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-sm font-bold text-[#7c736a]">+</span>
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Ex: 30"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-bold text-[#2d2a26] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                    />
                  </div>
                  <span className="text-xs text-[#7c736a] font-medium">novas cotas</span>
                </div>
              )}
            </div>
          </div>

          {/* Impact on Revenue */}
          <div className="bg-[#fdf1eb] p-3.5 rounded-2xl border border-[#f0c3b4] flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#D48166] block">Aumento no Potencial de Arrecadação:</span>
              <span className="text-[11px] text-[#7c736a]">
                +{countToAdd} cotas x {formatCurrency(raffle.pricePerNumber)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-black font-mono text-[#D48166] block">
                +{formatCurrency(additionalGross)}
              </span>
              <span className="text-[10px] text-[#7c736a]">
                Nova meta: {formatCurrency(newGrossGoal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#fdfaf7] border-t border-[#eee4db] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-[#f8f5f0] text-[#7c736a] hover:text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={countToAdd <= 0}
            className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#484832] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Confirmar e Adicionar +{countToAdd} Cotas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
