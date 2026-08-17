'use client';

import React, { useState } from 'react';
import { Raffle } from '@/types/raffle';
import { formatCurrency } from '@/lib/pix';
import {
  Copy,
  Check,
  QrCode,
  Sparkles,
  Coffee,
  Utensils,
  GraduationCap,
  HeartHandshake,
  Calendar,
  MapPin,
  Share2,
  FileText,
  Edit3,
  PlusCircle,
  Award,
  Info,
} from 'lucide-react';
import { sounds } from '@/lib/sound';

interface RafflePosterHeroProps {
  raffle: Raffle;
  totalSold: number;
  totalReserved: number;
  totalAvailable: number;
  onOpenCheckout?: () => void;
  onOpenDetails?: () => void;
  onOpenEditRaffle?: () => void;
  onOpenNewRaffle?: () => void;
}

export const RafflePosterHero: React.FC<RafflePosterHeroProps> = ({
  raffle,
  totalSold,
  totalReserved,
  totalAvailable,
  onOpenDetails,
  onOpenEditRaffle,
  onOpenNewRaffle,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const percentSold = Math.round((totalSold / raffle.totalNumbers) * 100);
  const totalArrecadado = totalSold * raffle.pricePerNumber;
  const metaTotal = raffle.totalNumbers * raffle.pricePerNumber;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(raffle.pixKey);
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = window.location.href;
      let text = `🎟️ *${raffle.title}*\n`;
      text += `🏛️ ${raffle.chapelOrOrgName}\n\n`;
      text += `🎯 ${raffle.causeDescription}\n\n`;
      text += `🎁 *Prêmios:*\n`;
      raffle.prizes.forEach((p, idx) => {
        text += `• ${p.title || `${idx + 1}º Prêmio`}: ${p.description}\n`;
      });
      text += `\n💰 Valor da Cota: ${formatCurrency(raffle.pricePerNumber)}\n`;
      text += `🔑 Chave PIX: ${raffle.pixKey}\n`;
      text += `\nParticipe agora: ${shareUrl}`;

      if (navigator.share) {
        navigator.share({
          title: raffle.title,
          text,
          url: shareUrl,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text);
        sounds.playSuccess();
        alert('Texto e link da rifa copiados para a área de transferência!');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-3 sm:px-4 space-y-3">
      {/* Quick Action Top Bar for Raffle Management & Details */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-[#f8f5f0] text-[#5A5A40] font-bold text-xs rounded-xl border border-[#eee4db] shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#D48166]" />
              <span>Ver Detalhes dos Prêmios & Regulamento</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenEditRaffle && (
            <button
              onClick={onOpenEditRaffle}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#f8f5f0] text-[#7c736a] hover:text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] shadow-2xs transition-colors"
              title="Editar dados, prêmios ou chave PIX"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Editar Rifa</span>
            </button>
          )}

          {onOpenNewRaffle && (
            <button
              onClick={onOpenNewRaffle}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              title="Iniciar uma nova rifa do zero"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#fdfaf7]" />
              <span>Iniciar Nova Rifa</span>
            </button>
          )}
        </div>
      </div>

      {/* Authentic Traditional Parish Raffle Poster Card in Natural Tones */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border-2 border-[#eee4db] bg-[#5A5A40] text-[#2d2a26]">
        {/* Filigree Corner Accents */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#D48166]/60 rounded-tl-xl pointer-events-none opacity-80" />
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#D48166]/60 rounded-tr-xl pointer-events-none opacity-80" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#D48166]/60 rounded-bl-xl pointer-events-none opacity-80" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#D48166]/60 rounded-br-xl pointer-events-none opacity-80" />

        {/* Top Header Section with Natural Tones Sacred Layout */}
        <div className="pt-6 pb-4 px-4 sm:px-8 bg-[#fdfaf7] text-center relative border-b-2 border-[#eee4db]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f4ee] text-[#484832] rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-[#d1dec8]">
            <Sparkles className="w-3.5 h-3.5 text-[#D48166]" />
            {raffle.category || 'Ação Solidária'}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#2d2a26] uppercase tracking-tight leading-tight font-serif">
            {raffle.title}
          </h1>

          {/* Cause Highlight Card */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white rounded-2xl p-4 sm:p-5 border border-[#eee4db] shadow-xs text-left">
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-start gap-2">
                <HeartHandshake className="w-5 h-5 text-[#5A5A40] shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base font-semibold text-[#423d38] leading-snug">
                  {raffle.causeDescription}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7c736a] pt-1 border-t border-[#eee4db]">
                {raffle.chapelOrOrgName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D48166]" />
                    {raffle.chapelOrOrgName}
                  </span>
                )}
                {raffle.drawDate && (
                  <span className="flex items-center gap-1 font-semibold text-[#5A5A40]">
                    <Calendar className="w-3.5 h-3.5" />
                    Sorteio: {new Date(raffle.drawDate + 'T12:00:00').toLocaleDateString('pt-BR')} {raffle.drawTime ? `às ${raffle.drawTime}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Sacred / Community Badge */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-[#f8f5f0] rounded-xl border border-[#eee4db] text-center">
              <div className="w-12 h-12 rounded-full bg-[#5A5A40] text-[#fdfaf7] flex items-center justify-center shadow-xs mb-1 font-serif text-2xl font-black">
                ✟
              </div>
              <span className="text-xs font-bold text-[#2d2a26] uppercase tracking-tight">
                {raffle.chapelOrOrgName.includes('São José') ? 'São José Operário' : 'Ação Comunitária'}
              </span>
              <span className="text-[11px] text-[#7c736a] font-medium">
                {raffle.chapelOrOrgName.includes('São José') ? 'Rogai por nós!' : 'Participe e apoie!'}
              </span>
            </div>
          </div>
        </div>

        {/* Prizes Section - Dynamic Cards */}
        <div className="p-4 sm:p-6 bg-[#5A5A40] text-white">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#fdfaf7] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#f0c3b4]" />
              Prêmios Oficiais ({raffle.prizes.length})
            </span>
            {onOpenDetails && (
              <button
                onClick={onOpenDetails}
                className="text-[11px] text-[#f0c3b4] hover:text-white underline font-bold flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" />
                Ver detalhes e doadores
              </button>
            )}
          </div>

          <div
            className={`grid gap-4 ${
              raffle.prizes.length === 1
                ? 'grid-cols-1 max-w-lg mx-auto'
                : raffle.prizes.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
            }`}
          >
            {raffle.prizes.map((prize, idx) => (
              <div
                key={prize.order || idx}
                className="relative bg-white text-[#2d2a26] rounded-2xl p-4 sm:p-5 border border-[#eee4db] shadow-md flex flex-col justify-between"
              >
                {/* Ribbon Badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#D48166] text-white font-black text-xs px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs whitespace-nowrap">
                  {prize.title || `${idx + 1}º PRÊMIO`}
                </div>

                <div className="pt-2 text-center">
                  <h3 className="text-base sm:text-lg font-bold text-[#2d2a26] font-serif leading-tight">
                    {prize.description}
                  </h3>

                  {prize.details && (
                    <p className="mt-2 text-xs text-[#7c736a] font-medium leading-relaxed">
                      {prize.details}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#eee4db] flex flex-wrap items-center justify-center gap-2 text-xs text-[#5A5A40]">
                  {prize.donorName && (
                    <span className="px-2 py-0.5 bg-[#f8f5f0] text-[#423d38] rounded-md font-semibold text-[11px] border border-[#eee4db]">
                      Doador: {prize.donorName}
                    </span>
                  )}
                  {prize.estimatedValue && (
                    <span className="px-2 py-0.5 bg-[#fdf1eb] text-[#8c4b38] rounded-md font-bold text-[11px] border border-[#f3d2c8]">
                      Est.: {formatCurrency(prize.estimatedValue)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Value Callout */}
          <div className="my-5 text-center">
            <div className="inline-block bg-[#D48166] text-white font-black text-xl sm:text-2xl px-6 py-2.5 rounded-xl shadow-md uppercase tracking-wide">
              VALOR DO NÚMERO: <span className="underline decoration-white/60">{formatCurrency(raffle.pricePerNumber)}</span>
            </div>
          </div>

          {/* Official PIX Box */}
          <div className="bg-[#484832] border border-[#5A5A40] rounded-2xl p-4 sm:p-5 shadow-md text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* PIX Logo & Chave */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-12 h-12 rounded-xl bg-[#3b3b28] border border-[#5A5A40] flex items-center justify-center shrink-0">
                  <div className="rotate-45 w-5 h-5 bg-[#D48166] rounded-xs" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#fdfaf7] font-black text-base uppercase tracking-wider">PAGAMENTO VIA PIX</span>
                    <span className="text-[11px] bg-[#3b3b28] text-[#e6dfd8] px-2 py-0.5 rounded font-mono">
                      {raffle.pixKeyType.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-0.5">
                    <span className="text-xs text-[#dcd5cc]">Chave PIX:</span>
                    <div className="font-mono text-sm sm:text-base font-bold text-[#fdfaf7] break-all select-all">
                      {raffle.pixKey}
                    </div>
                  </div>
                  {raffle.pixReceiverName && (
                    <div className="text-[11px] text-[#dcd5cc] mt-0.5">
                      Titular: <strong className="text-white">{raffle.pixReceiverName}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* PIX Actions: Copy, QR Code, Share */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={handleCopyPix}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#D48166] hover:bg-[#c27055] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Chave</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#3b3b28] hover:bg-[#2d2d1e] text-[#fdfaf7] font-semibold text-xs rounded-xl border border-[#5A5A40] transition-colors"
                  title="Exibir QR Code PIX"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="hidden sm:inline">QR Code</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center p-2.5 bg-[#3b3b28] hover:bg-[#2d2d1e] text-[#fdfaf7] rounded-xl border border-[#5A5A40] transition-colors"
                  title="Compartilhar rifa"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Progress & Stats Bar */}
          <div className="mt-4 pt-4 border-t border-[#484832]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-[#fdfaf7]">
                Progresso da Rifa ({percentSold}% vendido)
              </span>
              <span className="text-[#e6dfd8]">
                {totalSold} confirmados / {totalReserved} reservados / {totalAvailable} livres
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-3.5 bg-[#3b3b28] rounded-full overflow-hidden p-0.5 border border-[#5A5A40] flex">
              <div
                className="bg-[#D48166] h-full rounded-full transition-all duration-500"
                style={{ width: `${(totalSold / raffle.totalNumbers) * 100}%` }}
                title={`${totalSold} confirmados`}
              />
              <div
                className="bg-[#f0c3b4] h-full transition-all duration-500"
                style={{ width: `${(totalReserved / raffle.totalNumbers) * 100}%` }}
                title={`${totalReserved} aguardando pagamento`}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px] text-[#e6dfd8]">
              <span>
                Total Arrecadado: <strong className="text-white font-bold">{formatCurrency(totalArrecadado)}</strong>
              </span>
              <span>
                Meta Total: <strong className="text-white">{formatCurrency(metaTotal)}</strong> ({raffle.totalNumbers} cotas)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-2 border-[#eee4db]">
            <div className="inline-flex p-2 bg-[#f0f4ee] text-[#5A5A40] rounded-full mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#2d2a26] font-serif uppercase">QR Code PIX</h3>
            <p className="text-xs text-[#7c736a] mb-4">
              Abra o app do seu banco e aponte a câmera para ler o QR Code ou use a chave PIX abaixo:
            </p>

            <div className="bg-[#f8f5f0] p-4 rounded-2xl border border-[#eee4db] inline-block shadow-inner mb-4">
              <div className="w-48 h-48 bg-white p-2 border border-[#eee4db] rounded-xl flex flex-col items-center justify-center relative">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#2d2a26] fill-current">
                  <rect x="0" y="0" width="30" height="30" rx="4" fill="#2d2a26" />
                  <rect x="5" y="5" width="20" height="20" rx="2" fill="white" />
                  <rect x="9" y="9" width="12" height="12" rx="1" fill="#2d2a26" />
                  
                  <rect x="70" y="0" width="30" height="30" rx="4" fill="#2d2a26" />
                  <rect x="75" y="5" width="20" height="20" rx="2" fill="white" />
                  <rect x="79" y="9" width="12" height="12" rx="1" fill="#2d2a26" />
                  
                  <rect x="0" y="70" width="30" height="30" rx="4" fill="#2d2a26" />
                  <rect x="5" y="75" width="20" height="20" rx="2" fill="white" />
                  <rect x="9" y="79" width="12" height="12" rx="1" fill="#2d2a26" />

                  {/* PIX logo */}
                  <rect x="42" y="42" width="16" height="16" rx="3" fill="#D48166" />
                  <circle cx="50" cy="50" r="4" fill="white" />

                  <rect x="36" y="10" width="8" height="6" fill="#2d2a26" />
                  <rect x="50" y="12" width="6" height="8" fill="#2d2a26" />
                  <rect x="36" y="24" width="14" height="6" fill="#2d2a26" />
                  <rect x="10" y="38" width="8" height="8" fill="#2d2a26" />
                  <rect x="22" y="46" width="10" height="6" fill="#2d2a26" />
                  <rect x="68" y="38" width="12" height="8" fill="#2d2a26" />
                  <rect x="84" y="48" width="6" height="14" fill="#2d2a26" />
                  <rect x="38" y="68" width="8" height="12" fill="#2d2a26" />
                  <rect x="52" y="74" width="12" height="8" fill="#2d2a26" />
                  <rect x="70" y="70" width="10" height="10" fill="#2d2a26" />
                  <rect x="84" y="84" width="10" height="10" fill="#2d2a26" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-white/90 text-[#D48166] text-[10px] font-black px-1 rounded shadow-xs">PIX</span>
                </div>
              </div>
            </div>

            <div className="bg-[#f8f5f0] p-2.5 rounded-xl text-xs font-mono font-bold text-[#2d2a26] select-all mb-4 break-all border border-[#eee4db]">
              {raffle.pixKey}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyPix}
                className="flex-1 py-2.5 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {copied ? 'Chave Copiada!' : 'Copiar Chave'}
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-semibold text-xs rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
