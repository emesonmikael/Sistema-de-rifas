'use client';

import React, { useState } from 'react';
import { Raffle, Seller } from '@/types/raffle';
import { formatCurrency, generateWhatsAppLink } from '@/lib/pix';
import { sounds } from '@/lib/sound';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  Send,
  Sparkles,
  QrCode,
  ShieldCheck,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface BuyerCheckoutModalProps {
  raffle: Raffle;
  selectedNumbers: number[];
  sellers: Seller[];
  defaultSellerId?: string;
  onClose: () => void;
  onConfirm: (payload: {
    numbers: number[];
    buyerName: string;
    buyerPhone: string;
    buyerEmail?: string;
    sellerId?: string;
    sellerName?: string;
    isImmediatePaid: boolean;
  }) => void;
}

export const BuyerCheckoutModal: React.FC<BuyerCheckoutModalProps> = ({
  raffle,
  selectedNumbers,
  sellers,
  defaultSellerId,
  onClose,
  onConfirm,
}) => {
  const [step, setStep] = useState<'info' | 'pix'>('info');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [sellerId, setSellerId] = useState(defaultSellerId || sellers[0]?.id || '');
  const [isImmediatePaid, setIsImmediatePaid] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const totalPrice = selectedNumbers.length * raffle.pricePerNumber;
  const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b);
  const activeSeller = sellers.find((s) => s.id === sellerId) || sellers[0];

  const handleCopyPix = () => {
    navigator.clipboard.writeText(raffle.pixKey);
    setPixCopied(true);
    sounds.playPop();
    setTimeout(() => setPixCopied(false), 2500);
  };

  const handleProceedToPix = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      alert('Por favor, informe seu nome completo para o bilhete.');
      return;
    }
    if (!buyerPhone.trim()) {
      alert('Por favor, informe seu WhatsApp para receber o comprovante.');
      return;
    }
    sounds.playPop();
    setStep('pix');
  };

  const handleFinalConfirm = () => {
    sounds.playSuccess();
    onConfirm({
      numbers: sortedNumbers,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerEmail: buyerEmail.trim() || undefined,
      sellerId: activeSeller?.id,
      sellerName: activeSeller?.name,
      isImmediatePaid,
    });
  };

  const handleNotifyWhatsApp = () => {
    const message = `🎟️ *COMPROVANTE DE PAGAMENTO DE RIFA*\n\n` +
      `Olá, fiz a transferência do PIX para a *${raffle.title}*!\n\n` +
      `👤 *Nome:* ${buyerName}\n` +
      `🔢 *Cotas Escolhidas:* [ ${sortedNumbers.map((n) => n.toString().padStart(2, '0')).join(', ')} ]\n` +
      `💰 *Valor Total:* ${formatCurrency(totalPrice)}\n` +
      `🤝 *Vendedor Indicado:* ${activeSeller?.name || 'Coordenação'}\n\n` +
      `Segue o comprovante em anexo para confirmação do meu bilhete! 🙏`;

    const link = generateWhatsAppLink({
      phone: activeSeller?.phone || raffle.pixKey,
      message,
    });
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26]">
        {/* Modal Top Header */}
        <div className="bg-[#5A5A40] text-white p-5 flex items-center justify-between border-b border-[#484832]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#484832] flex items-center justify-center text-white font-bold border border-white/20">
              <Sparkles className="w-4 h-4 text-[#fdfaf7]" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-white">
                {step === 'info' ? 'Finalizar Reserva dos Bilhetes' : 'Pagamento via PIX Oficial'}
              </h3>
              <p className="text-xs text-[#e6dfd8]">{raffle.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Order Summary Strip */}
          <div className="bg-[#f8f5f0] rounded-2xl p-4 border border-[#eee4db] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#7c736a] block">Cotas Selecionadas ({sortedNumbers.length}):</span>
              <div className="font-mono font-bold text-sm text-[#2d2a26] mt-0.5">
                {sortedNumbers.map((n) => n.toString().padStart(2, '0')).join(', ')}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#7c736a] block">Total a Pagar:</span>
              <span className="font-mono font-black text-lg text-[#D48166]">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>

          {/* STEP 1: Buyer Data Form */}
          {step === 'info' && (
            <form onSubmit={handleProceedToPix} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                  Seu Nome Completo <span className="text-[#D48166]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maria das Graças Silva"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                  WhatsApp / Celular <span className="text-[#D48166]">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="(88) 99999-9999"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
                  required
                />
                <span className="text-[11px] text-[#7c736a] mt-1 block">
                  Você receberá seu bilhete digital e o aviso caso seja sorteado neste número.
                </span>
              </div>

              {/* Seller Selector */}
              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>Vendedor que lhe atendeu:</span>
                </label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-xs font-semibold text-[#2d2a26] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role === 'admin' ? 'Coordenador' : 'Vendedor'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#D48166] hover:bg-[#c27055] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <span>Avançar para Pagamento PIX</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-semibold text-xs rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PIX Payment Display & Confirmation */}
          {step === 'pix' && (
            <div className="space-y-4 animate-fade-in">
              {/* PIX Box */}
              <div className="bg-[#484832] text-white p-4 rounded-2xl border border-[#5A5A40] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[#fdfaf7]">Chave PIX Oficial:</span>
                  <span className="font-mono text-[11px] bg-[#3b3b28] px-2 py-0.5 rounded text-[#e6dfd8]">
                    {raffle.pixKeyType.toUpperCase()}
                  </span>
                </div>

                <div className="bg-[#3b3b28] p-3 rounded-xl font-mono text-sm font-bold text-[#fdfaf7] break-all select-all flex items-center justify-between gap-2 border border-[#5A5A40]">
                  <span>{raffle.pixKey}</span>
                  <button
                    onClick={handleCopyPix}
                    className="p-1.5 bg-[#D48166] hover:bg-[#c27055] text-white rounded-lg transition-colors shrink-0"
                    title="Copiar Chave"
                  >
                    {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-[11px] text-[#e6dfd8] flex justify-between">
                  <span>Favorecido: <strong className="text-white">{raffle.pixReceiverName || 'Capela'}</strong></span>
                  <span>Valor: <strong className="text-[#fdfaf7] font-bold">{formatCurrency(totalPrice)}</strong></span>
                </div>
              </div>

              {/* Immediate Paid Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-[#f8f5f0] rounded-xl border border-[#eee4db]">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={isImmediatePaid}
                  onChange={(e) => setIsImmediatePaid(e.target.checked)}
                  className="w-4 h-4 text-[#5A5A40] rounded focus:ring-[#5A5A40]"
                />
                <label htmlFor="paidCheck" className="text-xs font-bold text-[#2d2a26] cursor-pointer">
                  Já efetuei o pagamento agora (Confirmar como cota PAGA)
                </label>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="w-full py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir e Gerar Bilhete Digital</span>
                </button>

                <button
                  type="button"
                  onClick={handleNotifyWhatsApp}
                  className="w-full py-2.5 bg-[#f0f4ee] hover:bg-[#e4ede1] text-[#3d4b3d] border border-[#d1dec8] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4 text-[#5A5A40]" />
                  <span>Enviar Comprovante pelo WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="w-full py-1 text-xs text-[#7c736a] hover:text-[#2d2a26]"
                >
                  Voltar e alterar dados
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
