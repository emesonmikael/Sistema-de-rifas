'use client';

import React, { useState } from 'react';
import { Raffle } from '@/types/raffle';
import { formatCurrency, generateWhatsAppLink } from '@/lib/pix';
import {
  X,
  Gift,
  Calendar,
  MapPin,
  Sparkles,
  HeartHandshake,
  FileText,
  Copy,
  Check,
  Share2,
  Printer,
  Edit3,
  Coffee,
  GraduationCap,
  Award,
  Tag,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { sounds } from '@/lib/sound';

interface RaffleDetailsModalProps {
  raffle: Raffle;
  onClose: () => void;
  onOpenEdit?: () => void;
}

export const RaffleDetailsModal: React.FC<RaffleDetailsModalProps> = ({
  raffle,
  onClose,
  onOpenEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPixQr, setShowPixQr] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(raffle.pixKey);
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    let text = `🎟️ *${raffle.title}*\n`;
    text += `🏛️ *${raffle.chapelOrOrgName}*\n\n`;
    text += `🎯 *Objetivo:* ${raffle.causeDescription}\n\n`;
    text += `🎁 *PRÊMIOS:*\n`;
    raffle.prizes.forEach((p, idx) => {
      text += `• *${p.title || `${idx + 1}º PRÊMIO`}:* ${p.description}\n`;
      if (p.donorName) text += `  _(Doador/Parceria: ${p.donorName})_\n`;
    });
    text += `\n💰 *Valor da Cota:* ${formatCurrency(raffle.pricePerNumber)}\n`;
    text += `🔑 *Chave PIX:* ${raffle.pixKey} (${raffle.pixReceiverName || 'Coordenação'})\n`;
    if (raffle.drawDate) {
      text += `📅 *Sorteio:* ${new Date(raffle.drawDate + 'T12:00:00').toLocaleDateString('pt-BR')} ${raffle.drawTime ? `às ${raffle.drawTime}` : ''}\n`;
    }
    text += `\nParticipe e apoie nossa causa!`;

    if (navigator.share) {
      navigator.share({
        title: raffle.title,
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      sounds.playSuccess();
      alert('Texto detalhado da rifa copiado para envio no WhatsApp!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#484832] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#484832] flex items-center justify-center font-bold text-white shadow-xs border border-white/20">
              <Gift className="w-6 h-6 text-[#fdfaf7]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-extrabold bg-[#484832] text-[#fdfaf7] px-2.5 py-0.5 rounded-full border border-white/20">
                  {raffle.category || 'Nota Oficial da Rifa'}
                </span>
                {raffle.status === 'active' && (
                  <span className="text-[10px] bg-emerald-700 text-emerald-100 font-bold px-2 py-0.5 rounded-full">
                    Ativa & Em Andamento
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight mt-0.5">
                {raffle.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 bg-[#fdfaf7]">
          {/* Cause & Community Banner */}
          <div className="bg-white rounded-2xl p-5 border border-[#eee4db] shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <HeartHandshake className="w-6 h-6 text-[#5A5A40] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c736a]">
                  Causa & Finalidade Beneficente
                </h3>
                <p className="text-base font-semibold text-[#2d2a26] mt-1 leading-relaxed">
                  {raffle.causeDescription}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-[#eee4db] text-xs text-[#5A5A40]">
              <span className="flex items-center gap-1.5 font-bold">
                <MapPin className="w-4 h-4 text-[#D48166]" />
                {raffle.chapelOrOrgName} {raffle.location ? `• ${raffle.location}` : ''}
              </span>

              {raffle.drawDate && (
                <span className="flex items-center gap-1.5 font-bold">
                  <Calendar className="w-4 h-4 text-[#5A5A40]" />
                  Data do Sorteio: {new Date(raffle.drawDate + 'T12:00:00').toLocaleDateString('pt-BR')} {raffle.drawTime ? `às ${raffle.drawTime}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Detailed Prizes Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#423d38] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#D48166]" />
                <span>Detalhamento Completo dos Prêmios ({raffle.prizes.length})</span>
              </h3>
              <span className="text-xs text-[#7c736a] font-medium">
                Valor por cota: <strong className="text-[#5A5A40] font-black">{formatCurrency(raffle.pricePerNumber)}</strong>
              </span>
            </div>

            <div className="space-y-4">
              {raffle.prizes.map((prize, idx) => (
                <div
                  key={prize.order || idx}
                  className="bg-white rounded-2xl p-5 border border-[#eee4db] shadow-xs relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-[#5A5A40] text-[#fdfaf7] text-xs font-black px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                    {prize.title || `${idx + 1}º PRÊMIO`}
                  </div>

                  <div className="pr-20">
                    <h4 className="text-lg font-black text-[#2d2a26] font-serif">
                      {prize.description}
                    </h4>

                    {prize.details && (
                      <p className="mt-2 text-xs sm:text-sm text-[#5a534c] leading-relaxed bg-[#f8f5f0] p-3 rounded-xl border border-[#eee4db]">
                        {prize.details}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      {prize.donorName && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f4ee] text-[#484832] font-semibold rounded-lg border border-[#d1dec8]">
                          <HeartHandshake className="w-3.5 h-3.5 text-[#5A5A40]" />
                          Doador/Parceiro: <strong>{prize.donorName}</strong>
                        </span>
                      )}

                      {prize.estimatedValue && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdf1eb] text-[#8c4b38] font-bold rounded-lg border border-[#f3d2c8]">
                          <Tag className="w-3.5 h-3.5 text-[#D48166]" />
                          Valor Estimado: {formatCurrency(prize.estimatedValue)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Regulation & Rules */}
          <div className="bg-white rounded-2xl p-5 border border-[#eee4db] shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#423d38] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5A5A40]" />
              <span>Regulamento & Normas da Rifa</span>
            </h3>

            <div className="text-xs text-[#5a534c] leading-relaxed whitespace-pre-line bg-[#f8f5f0] p-4 rounded-xl border border-[#eee4db] font-mono">
              {raffle.regulation ||
                `1. A presente rifa é de caráter beneficente em prol da ${raffle.chapelOrOrgName}.\n2. O sorteio será realizado ao vivo com base nas cotas pagas e confirmadas.\n3. O ganhador será contatado imediatamente pelo número de telefone cadastrado.\n4. O prêmio poderá ser retirado na secretaria da comunidade.`}
            </div>

            {raffle.drawLocation && (
              <div className="text-xs text-[#7c736a] flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#5A5A40]" />
                Auditoria & Local: <strong>{raffle.drawLocation}</strong>
              </div>
            )}
          </div>

          {/* Official PIX Box */}
          <div className="bg-[#484832] text-white rounded-2xl p-5 border border-[#5A5A40] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#dcd5cc]">
                  Dados para Pagamento PIX Oficial
                </span>
                <div className="font-mono text-base font-black text-white mt-0.5 select-all">
                  {raffle.pixKey}
                </div>
                <div className="text-xs text-[#e6dfd8] mt-0.5">
                  Titular: <strong>{raffle.pixReceiverName || 'Coordenação da Rifa'}</strong> • Tipo: {raffle.pixKeyType.toUpperCase()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPix}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#D48166] hover:bg-[#c27055] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar PIX</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white p-4 sm:p-5 border-t border-[#eee4db] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEdit();
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] transition-colors"
              >
                <Edit3 className="w-4 h-4 text-[#5A5A40]" />
                <span>Editar Nota & Prêmios</span>
              </button>
            )}

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f0f4ee] hover:bg-[#dce7d8] text-[#3d4b3d] font-bold text-xs rounded-xl border border-[#d1dec8] transition-colors"
            >
              <Share2 className="w-4 h-4 text-[#5A5A40]" />
              <span>Compartilhar Detalhes</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
