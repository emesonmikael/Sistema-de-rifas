'use client';

import React from 'react';
import { Raffle, RaffleNumber } from '@/types/raffle';
import { formatCurrency, generateWhatsAppLink } from '@/lib/pix';
import { X, Send, Printer, Award } from 'lucide-react';

interface DigitalReceiptModalProps {
  raffle: Raffle;
  numberData: RaffleNumber;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  raffle,
  numberData,
  onClose,
}) => {
  const isPaid = numberData.status === 'paid';
  const numFormatted = numberData.number.toString().padStart(2, '0');

  const handleShareWhatsApp = () => {
    if (!numberData.buyerPhone) return;

    const message =
      `🎟️ *COMPROVANTE / BILHETE DIGITAL OFICIAL*\n\n` +
      `📌 *${raffle.title}*\n` +
      `🏛️ *Entidade:* ${raffle.chapelOrOrgName}\n` +
      `🔢 *Cota da Sorte:* [ ${numFormatted} ]\n` +
      `👤 *Participante:* ${numberData.buyerName || 'Comprador'}\n` +
      `💰 *Valor:* ${formatCurrency(raffle.pricePerNumber)} (${numberData.paymentMethod || 'PIX'})\n` +
      `✅ *Status:* ${isPaid ? 'CONFIRMADO E PAGO' : 'RESERVA AGUARDANDO CONFIRMAÇÃO'}\n` +
      `🤝 *Vendedor:* ${numberData.sellerName || 'Comissão'}\n` +
      `🔑 *Código do Recibo:* ${numberData.receiptId || 'OFICIAL-8829'}\n\n` +
      `Agradecemos seu apoio à nossa capela! Que São José abençoe! 🙏`;

    const link = generateWhatsAppLink({ phone: numberData.buyerPhone, message });
    if (typeof window !== 'undefined') {
      window.location.href = link;
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26]">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-4 flex items-center justify-between border-b border-[#484832] shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#fdfaf7]" />
            <span className="font-serif font-black text-sm text-white">Bilhete Digital Oficial</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Graphic Body in Natural Tones - Scrollable */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="relative rounded-2xl bg-[#fdfaf7] p-4 sm:p-5 border-2 border-dashed border-[#eee4db] shadow-inner text-center">
            {/* Stamp */}
            <div className="absolute top-3 right-3 rotate-12">
              {isPaid ? (
                <span className="px-2.5 py-1 bg-[#5A5A40] text-white font-black text-[10px] rounded-lg uppercase tracking-wider shadow-xs border border-[#484832]">
                  ✓ PAGO
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-[#D48166] text-white font-black text-[10px] rounded-lg uppercase tracking-wider shadow-xs">
                  ⏳ RESERVA
                </span>
              )}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">
              {raffle.chapelOrOrgName}
            </div>
            <h4 className="font-serif font-black text-sm sm:text-base text-[#2d2a26] mt-0.5 uppercase">
              {raffle.title}
            </h4>

            {/* Giant Number */}
            <div className="my-3 sm:my-4 py-3 bg-[#5A5A40] text-white rounded-2xl border border-[#484832] shadow-inner">
              <span className="text-[11px] sm:text-xs text-[#e6dfd8] block uppercase tracking-widest font-sans font-semibold">
                NÚMERO DA SORTE
              </span>
              <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-[#fdfaf7]">
                {numFormatted}
              </span>
            </div>

            {/* Ticket Metadata */}
            <div className="space-y-1.5 text-xs text-left bg-white p-3 rounded-xl border border-[#eee4db]">
              <div className="flex justify-between">
                <span className="text-[#7c736a]">Participante:</span>
                <strong className="text-[#2d2a26] truncate max-w-[170px]">{numberData.buyerName || 'Sem nome'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c736a]">WhatsApp:</span>
                <span className="font-mono text-[#423d38]">{numberData.buyerPhone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c736a]">Valor da Cota:</span>
                <strong className="text-[#5A5A40]">{formatCurrency(raffle.pricePerNumber)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c736a]">Forma de Pgto:</span>
                <span className="font-semibold text-[#423d38]">{numberData.paymentMethod || 'PIX'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7c736a]">Vendedor:</span>
                <span className="text-[#423d38]">{numberData.sellerName || 'Comissão'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#eee4db] text-[10px] text-[#a89d91]">
                <span>Autenticação:</span>
                <span className="font-mono">{numberData.receiptId || 'REC-8829-OK'}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {numberData.buyerPhone && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Bilhete no WhatsApp do Comprador</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#2d2a26] border border-[#eee4db] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Bilhete</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-semibold text-xs rounded-xl active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
