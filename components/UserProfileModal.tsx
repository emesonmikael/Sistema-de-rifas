'use client';

import React, { useState } from 'react';
import { Seller } from '@/types/raffle';
import { sounds } from '@/lib/sound';
import {
  User,
  ShieldCheck,
  KeyRound,
  LogOut,
  X,
  Check,
  Copy,
  Phone,
  Mail,
  Target,
  Sparkles,
  QrCode,
  Share2,
} from 'lucide-react';

interface UserProfileModalProps {
  currentUser: Seller;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePin: (newPin: string) => void;
  onLogout: () => void;
  onSwitchUser: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdatePin,
  onLogout,
  onSwitchUser,
}) => {
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    const actualCurrentPin = currentUser.pin || '1234';

    if (currentPinInput.trim() !== actualCurrentPin.trim()) {
      setPinError('PIN atual incorreto.');
      return;
    }

    if (newPinInput.length < 4) {
      setPinError('O novo PIN deve conter no mínimo 4 dígitos.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError('A confirmação do novo PIN não confere.');
      return;
    }

    onUpdatePin(newPinInput.trim());
    sounds.playSuccess();
    setPinSuccess('PIN alterado com sucesso!');
    setTimeout(() => {
      setIsChangingPin(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setPinSuccess(null);
    }, 1500);
  };

  const handleCopySellerLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/?vendedor=${currentUser.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    sounds.playSuccess();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26]">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#484832] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#484832] flex items-center justify-center border border-white/20 shadow-xs shrink-0">
              <User className="w-5 h-5 text-[#fdfaf7]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-black text-base sm:text-lg text-white truncate">
                Perfil de Acesso
              </h3>
              <p className="text-xs text-[#e6dfd8] truncate">
                {currentUser.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white transition-colors active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* User Badge Card */}
          <div className="bg-[#f8f5f0] p-4 rounded-2xl border border-[#eee4db] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl text-white font-black text-base flex items-center justify-center shrink-0 ${
                  isAdmin ? 'bg-[#5A5A40]' : 'bg-[#D48166]'
                }`}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h4 className="font-black text-sm text-[#2d2a26] truncate">{currentUser.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-[#e8f0e8] text-[#3d4b3d] border border-[#d1dec8]'
                        : 'bg-[#fdf1eb] text-[#D48166] border border-[#f0c3b4]'
                    }`}
                  >
                    {isAdmin ? '👑 Coordenador Geral (Admin)' : '🤝 Vendedor / Promotor'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-[#f8f5f0] rounded-xl border border-[#eee4db]">
              <span className="text-[#7c736a] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#5A5A40]" />
                WhatsApp / Contato:
              </span>
              <span className="font-mono font-bold text-[#2d2a26]">{currentUser.phone}</span>
            </div>

            {currentUser.email && (
              <div className="flex items-center justify-between p-2.5 bg-[#f8f5f0] rounded-xl border border-[#eee4db]">
                <span className="text-[#7c736a] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#5A5A40]" />
                  E-mail:
                </span>
                <span className="font-medium text-[#2d2a26] truncate max-w-[180px]">
                  {currentUser.email}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-2.5 bg-[#f8f5f0] rounded-xl border border-[#eee4db]">
              <span className="text-[#7c736a] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#D48166]" />
                Meta de Cotas:
              </span>
              <span className="font-mono font-bold text-[#2d2a26]">
                {currentUser.targetNumbers || 20} cotas
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#f8f5f0] rounded-xl border border-[#eee4db]">
              <span className="text-[#7c736a] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#5A5A40]" />
                PIN de Segurança:
              </span>
              <span className="font-mono font-bold text-[#5A5A40]">
                {currentUser.pin || '1234'}
              </span>
            </div>
          </div>

          {/* Seller Direct Link */}
          <div className="p-3 bg-[#f0f4ee] border border-[#d1dec8] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3d4b3d] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Seu Link Exclusivo de Vendas:
              </span>
            </div>
            <p className="text-[11px] text-[#556955]">
              Ao compartilhar seu link, todas as vendas abertas pelo comprador serão vinculadas a você.
            </p>
            <button
              type="button"
              onClick={handleCopySellerLink}
              className="w-full py-2 bg-white hover:bg-[#e4ede1] text-[#3d4b3d] font-bold text-xs rounded-xl border border-[#d1dec8] flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-2xs"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#5A5A40]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copiado para o WhatsApp!' : 'Copiar Meu Link de Vendedor'}</span>
            </button>
          </div>

          {/* Change PIN section */}
          {isChangingPin ? (
            <form onSubmit={handleSaveNewPin} className="p-3.5 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#423d38]">
                Alterar PIN de Acesso
              </h4>

              {pinError && (
                <div className="p-2 bg-[#fdf1eb] border border-[#f0c3b4] rounded-lg text-xs text-[#b35c43] font-semibold">
                  {pinError}
                </div>
              )}

              {pinSuccess && (
                <div className="p-2 bg-[#f0f4ee] border border-[#d1dec8] rounded-lg text-xs text-[#3d4b3d] font-semibold">
                  {pinSuccess}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#423d38] mb-1">
                  PIN Atual:
                </label>
                <input
                  type="password"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  maxLength={6}
                  placeholder="PIN atual (ex: 1234)"
                  className="w-full px-3 py-2 bg-white border border-[#eee4db] rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#423d38] mb-1">
                    Novo PIN:
                  </label>
                  <input
                    type="password"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    maxLength={6}
                    placeholder="4 a 6 dígitos"
                    className="w-full px-3 py-2 bg-white border border-[#eee4db] rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#423d38] mb-1">
                    Confirmar PIN:
                  </label>
                  <input
                    type="password"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    maxLength={6}
                    placeholder="Repita o novo PIN"
                    className="w-full px-3 py-2 bg-white border border-[#eee4db] rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95"
                >
                  Salvar Novo PIN
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="px-3 py-2 bg-white text-[#7c736a] text-xs font-semibold rounded-xl border border-[#eee4db] active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsChangingPin(true)}
              className="w-full py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Trocar Meu PIN de Acesso</span>
            </button>
          )}

          {/* Action Footer: Switch user & Logout */}
          <div className="pt-2 border-t border-[#eee4db] flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchUser();
              }}
              className="flex-1 py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] flex items-center justify-center gap-1.5 active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Alternar Usuário</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="px-4 py-2.5 bg-[#fdf1eb] hover:bg-[#fae4da] text-[#b35c43] font-bold text-xs rounded-xl border border-[#f0c3b4] flex items-center justify-center gap-1.5 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
