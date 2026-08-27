'use client';

import React, { useState } from 'react';
import {
  Layers,
  Trash2,
  CheckCircle2,
  Plus,
  Edit3,
  Calendar,
  DollarSign,
  Ticket,
  AlertTriangle,
  X,
  Sparkles,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Raffle } from '@/types/raffle';

interface RaffleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffles: Raffle[];
  activeRaffleId: string;
  onSelectRaffle: (raffleId: string) => void;
  onDeleteRaffle: (raffleId: string) => void;
  onOpenNewRaffle: () => void;
  onOpenEditRaffle?: () => void;
}

export const RaffleManagerModal: React.FC<RaffleManagerModalProps> = ({
  isOpen,
  onClose,
  raffles,
  activeRaffleId,
  onSelectRaffle,
  onDeleteRaffle,
  onOpenNewRaffle,
  onOpenEditRaffle,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const raffleToDelete = raffles.find((r) => r.id === confirmDeleteId);

  const handleDeleteConfirmed = () => {
    if (confirmDeleteId) {
      onDeleteRaffle(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#eee4db] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#5A5A40] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-white">
                  Gerenciador & Limpeza de Rifas
                </h2>
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-bold">
                  {raffles.length} {raffles.length === 1 ? 'rifa' : 'rifas'}
                </span>
              </div>
              <p className="text-xs text-white/80">
                Selecione a rifa ativa ou apague rifas antigas para organizar sua lista
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Quick Action Bar */}
        <div className="p-3 sm:p-4 bg-[#f8f5f0] border-b border-[#eee4db] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-xs font-bold text-[#7c736a]">
            Lista de Rifas Cadastradas
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenNewRaffle();
            }}
            className="px-3 py-1.5 bg-[#D48166] hover:bg-[#c27055] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Criar Nova Rifa</span>
          </button>
        </div>

        {/* Raffles List Container */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {raffles.map((raffle) => {
            const isSelected = raffle.id === activeRaffleId;
            const numbersArr = Object.values(raffle.numbers);
            const paidCount = numbersArr.filter((n) => n.status === 'paid').length;
            const reservedCount = numbersArr.filter((n) => n.status === 'reserved').length;
            const availableCount = numbersArr.filter((n) => n.status === 'available').length;
            const totalCollected = paidCount * raffle.pricePerNumber;
            const hasWinners = raffle.winners && raffle.winners.length > 0;
            const percentSold = Math.round((paidCount / raffle.totalNumbers) * 100);

            return (
              <div
                key={raffle.id}
                className={`rounded-2xl border transition-all p-3.5 sm:p-4 ${
                  isSelected
                    ? 'bg-[#f0f4ee] border-[#5A5A40] shadow-xs ring-1 ring-[#5A5A40]/20'
                    : 'bg-white border-[#eee4db] hover:border-[#c9bea9] hover:bg-[#fcfaf7]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left info */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-[#2d2a26]">
                        {raffle.title}
                      </span>

                      {isSelected && (
                        <span className="px-2 py-0.5 bg-[#5A5A40] text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Rifa Ativa
                        </span>
                      )}

                      {hasWinners && (
                        <span className="px-2 py-0.5 bg-[#fdf1eb] text-[#D48166] border border-[#fbdcd0] rounded-full text-[10px] font-bold flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Sorteada
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#7c736a]">
                      <span className="font-medium text-[#423d38]">{raffle.chapelOrOrgName}</span>
                      {raffle.location ? ` • ${raffle.location}` : ''}
                    </p>

                    {/* Stats pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] bg-white px-2 py-0.5 rounded-lg border border-[#eee4db] text-[#423d38] font-bold">
                        Valor: R$ {raffle.pricePerNumber},00 / cota
                      </span>
                      <span className="text-[11px] bg-white px-2 py-0.5 rounded-lg border border-[#eee4db] text-[#1e7e34] font-bold">
                        {paidCount}/{raffle.totalNumbers} pagas ({percentSold}%)
                      </span>
                      <span className="text-[11px] bg-white px-2 py-0.5 rounded-lg border border-[#eee4db] text-[#5A5A40] font-bold">
                        Arrecadado: R$ {totalCollected.toLocaleString('pt-BR')},00
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isSelected ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRaffle(raffle.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-[#5A5A40] hover:bg-[#484832] text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-2xs"
                      >
                        Tornar Ativa
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-[#5A5A40] px-2 py-1 bg-white rounded-xl border border-[#d1dec8]">
                        ✓ Em Uso
                      </span>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(raffle.id)}
                      className="p-2 text-[#a89d91] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                      title="Apagar e limpar esta rifa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {raffles.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <Layers className="w-10 h-10 text-[#a89d91] mx-auto opacity-50" />
              <p className="text-sm text-[#7c736a] font-medium">Nenhuma rifa encontrada.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewRaffle();
                }}
                className="px-4 py-2 bg-[#D48166] text-white rounded-xl text-xs font-bold hover:bg-[#c27055]"
              >
                Criar Primeira Rifa
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 bg-[#f8f5f0] border-t border-[#eee4db] flex items-center justify-between text-xs text-[#7c736a] shrink-0">
          <span>
            💡 Dica: Você pode criar quantas rifas desejar e alternar entre elas a qualquer momento.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-[#eee4db] text-[#423d38] border border-[#eee4db] font-bold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Confirmation Dialog Modal for Deleting Raffle */}
      {confirmDeleteId && raffleToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-red-200 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-lg text-[#2d2a26]">
                Apagar Rifa Definitivamente?
              </h3>
              <p className="text-xs text-[#7c736a]">
                Você está prestes a apagar a rifa:
              </p>
              <p className="text-sm font-bold text-red-600 bg-red-50 py-1.5 px-3 rounded-xl border border-red-200 inline-block">
                {raffleToDelete.title}
              </p>
              <p className="text-xs text-[#7c736a] pt-1">
                Todas as cotas, reservas e despesas vinculadas a esta rifa serão removidas do sistema.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Apagar Rifa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
