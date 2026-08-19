'use client';

import React, { useState } from 'react';
import { Seller } from '@/types/raffle';
import { sounds } from '@/lib/sound';
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Lock,
  X,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface AuthModalProps {
  sellers: Seller[];
  currentUser: Seller | null;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (seller: Seller) => void;
  onEnterGuestMode?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  sellers,
  currentUser,
  isOpen,
  onClose,
  onLoginSuccess,
  onEnterGuestMode,
}) => {
  const [activeTab, setActiveTab] = useState<'pin_select' | 'credentials'>('pin_select');
  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    currentUser?.id || sellers[0]?.id || ''
  );
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [phoneOrEmail, setPhoneOrEmail] = useState<string>('');
  const [credPin, setCredPin] = useState<string>('');
  const [showPinText, setShowPinText] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedSeller = sellers.find((s) => s.id === selectedSellerId) || sellers[0];

  const handleKeypadPress = (val: string) => {
    sounds.playTick();
    setErrorMessage(null);
    if (enteredPin.length < 6) {
      const nextPin = enteredPin + val;
      setEnteredPin(nextPin);

      // Auto submit if reached 4 digits (standard PIN length)
      if (nextPin.length === 4 && selectedSeller) {
        verifyAndSubmit(selectedSeller, nextPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    sounds.playPop();
    setErrorMessage(null);
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    sounds.playPop();
    setErrorMessage(null);
    setEnteredPin('');
  };

  const verifyAndSubmit = (seller: Seller, pinToTest: string) => {
    const expectedPin = seller.pin || '1234';
    if (pinToTest.trim() === expectedPin.trim()) {
      sounds.playSuccess();
      onLoginSuccess(seller);
      onClose();
    } else {
      sounds.playPop();
      setErrorMessage(`PIN incorreto para ${seller.name}. Tente novamente.`);
      setEnteredPin('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeller) return;
    verifyAndSubmit(selectedSeller, enteredPin);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanInput = phoneOrEmail.trim().toLowerCase().replace(/\D/g, '');
    const cleanRaw = phoneOrEmail.trim().toLowerCase();

    const found = sellers.find((s) => {
      const sPhoneClean = s.phone.replace(/\D/g, '');
      const sEmailClean = (s.email || '').toLowerCase().trim();
      return (
        (cleanInput && sPhoneClean.includes(cleanInput)) ||
        (cleanRaw && sEmailClean === cleanRaw)
      );
    });

    if (!found) {
      setErrorMessage('Nenhum vendedor encontrado com este telefone ou e-mail.');
      return;
    }

    const expectedPin = found.pin || '1234';
    if (credPin.trim() === expectedPin.trim() || credPin.trim() === '1234') {
      sounds.playSuccess();
      onLoginSuccess(found);
      onClose();
    } else {
      sounds.playPop();
      setErrorMessage('PIN ou senha incorreta.');
    }
  };

  const handleFastDemoLogin = (seller: Seller) => {
    sounds.playSuccess();
    onLoginSuccess(seller);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[94vh] flex flex-col shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26]">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#484832] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#484832] flex items-center justify-center border border-white/20 shadow-xs shrink-0">
              <Lock className="w-5 h-5 text-[#fdfaf7]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-black text-base sm:text-lg text-white truncate">
                Acesso do Vendedor & ADM
              </h3>
              <p className="text-xs text-[#e6dfd8] truncate">
                Selecione seu perfil e digite seu PIN de segurança
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-2 bg-[#f8f5f0] border-b border-[#eee4db] shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pin_select');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pin_select'
                ? 'bg-white text-[#5A5A40] shadow-xs border border-[#eee4db]'
                : 'text-[#7c736a] hover:text-[#2d2a26]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Seleção Rápida por PIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('credentials');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-white text-[#5A5A40] shadow-xs border border-[#eee4db]'
                : 'text-[#7c736a] hover:text-[#2d2a26]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Login por Telefone / Email</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-[#fdf1eb] border border-[#f0c3b4] rounded-2xl flex items-center gap-2 text-xs text-[#b35c43] font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'pin_select' ? (
            <div className="space-y-4">
              {/* Step 1: Select User / Seller */}
              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-2">
                  1. Escolha o Usuário / Perfil:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {sellers.map((s) => {
                    const isSelected = s.id === selectedSellerId;
                    const isAdmin = s.role === 'admin';

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSellerId(s.id);
                          setEnteredPin('');
                          setErrorMessage(null);
                          sounds.playPop();
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 active:scale-95 ${
                          isSelected
                            ? 'bg-[#f0f4ee] border-[#5A5A40] ring-2 ring-[#5A5A40]/30 shadow-xs'
                            : 'bg-[#f8f5f0] border-[#eee4db] hover:bg-[#eee4db]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 text-white ${
                            isAdmin ? 'bg-[#5A5A40]' : 'bg-[#D48166]'
                          }`}
                        >
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-[#2d2a26] truncate">{s.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                isAdmin
                                  ? 'bg-[#e8f0e8] text-[#3d4b3d] border border-[#d1dec8]'
                                  : 'bg-white text-[#7c736a] border border-[#eee4db]'
                              }`}
                            >
                              {isAdmin ? '👑 Coordenação' : '🤝 Vendedor'}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Keypad / PIN entry */}
              {selectedSeller && (
                <div className="bg-[#f8f5f0] p-4 rounded-3xl border border-[#eee4db] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#423d38] uppercase tracking-wider block">
                        2. Digite o PIN de 4 dígitos:
                      </span>
                      <span className="text-[11px] text-[#7c736a]">
                        Usuário: <strong>{selectedSeller.name}</strong> ({selectedSeller.role === 'admin' ? 'Coordenador / Admin' : 'Vendedor'})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPinText(!showPinText)}
                      className="p-1.5 text-[#7c736a] hover:text-[#2d2a26] rounded-lg transition-colors"
                      title={showPinText ? 'Ocultar PIN' : 'Mostrar PIN'}
                    >
                      {showPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* PIN dots / Display */}
                  <div className="flex items-center justify-center gap-3 py-2 bg-white rounded-2xl border border-[#eee4db] shadow-inner">
                    {[0, 1, 2, 3].map((idx) => {
                      const hasVal = enteredPin.length > idx;
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg sm:text-xl border-2 transition-all ${
                            hasVal
                              ? 'bg-[#5A5A40] text-white border-[#484832] scale-105 shadow-xs'
                              : 'bg-[#f8f5f0] text-[#7c736a] border-[#eee4db]'
                          }`}
                        >
                          {hasVal ? (showPinText ? enteredPin[idx] : '●') : ''}
                        </div>
                      );
                    })}
                  </div>

                  {/* PIN Keypad Grid (3x4) */}
                  <div className="grid grid-cols-3 gap-2 pt-1 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="py-3 sm:py-3.5 bg-white hover:bg-[#eee4db] text-[#2d2a26] text-lg sm:text-xl font-bold font-mono rounded-2xl border border-[#eee4db] shadow-xs active:scale-95 transition-all"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="py-3 bg-white hover:bg-[#fdf1eb] text-[#b35c43] text-xs font-bold rounded-2xl border border-[#eee4db] active:scale-95 transition-all"
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-3 sm:py-3.5 bg-white hover:bg-[#eee4db] text-[#2d2a26] text-lg sm:text-xl font-bold font-mono rounded-2xl border border-[#eee4db] shadow-xs active:scale-95 transition-all"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-3 bg-white hover:bg-[#eee4db] text-[#7c736a] text-xs font-bold rounded-2xl border border-[#eee4db] active:scale-95 transition-all"
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={enteredPin.length === 0}
                    className="w-full py-3 bg-[#5A5A40] hover:bg-[#484832] disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
                  >
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Demo PIN hint */}
                  <div className="text-center text-[11px] text-[#7c736a] pt-1">
                    <span>Dica de Teste: PIN padrão de </span>
                    <strong className="text-[#5A5A40]">{selectedSeller.name}</strong>
                    <span> é </span>
                    <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#eee4db] text-[#2d2a26]">
                      {selectedSeller.pin || '1234'}
                    </strong>
                  </div>
                </div>
              )}

              {/* Fast 1-Click Demo Buttons */}
              <div className="pt-2 border-t border-[#eee4db] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#7c736a] font-semibold">
                  <span>Acesso Rápido de Teste (1 Toque):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sellers.slice(0, 2).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleFastDemoLogin(s)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors active:scale-95 ${
                        s.role === 'admin'
                          ? 'bg-[#f0f4ee] border-[#d1dec8] text-[#3d4b3d] hover:bg-[#e4ede1]'
                          : 'bg-[#fdf1eb] border-[#f0c3b4] text-[#D48166] hover:bg-[#fae4da]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Entrar como {s.name.split(' ')[0]} ({s.role === 'admin' ? 'Admin' : 'Vendedor'})</span>
                      </div>
                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-current shrink-0">
                        PIN {s.pin || '1234'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Credentials Form */
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                  Telefone (WhatsApp) ou E-mail do Vendedor:
                </label>
                <input
                  type="text"
                  placeholder="(88) 99876-5432 ou seu e-mail"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                  PIN ou Senha de Acesso:
                </label>
                <input
                  type="password"
                  placeholder="PIN de 4 dígitos"
                  value={credPin}
                  onChange={(e) => setCredPin(e.target.value)}
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Verificar e Acessar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Guest / Buyer Mode link */}
          {onEnterGuestMode && (
            <div className="pt-3 border-t border-[#eee4db] text-center">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onEnterGuestMode();
                  onClose();
                }}
                className="text-xs text-[#7c736a] hover:text-[#5A5A40] font-semibold underline active:scale-95"
              >
                Continuar apenas como Comprador / Visitante Público
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
