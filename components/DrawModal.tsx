'use client';

import React, { useState } from 'react';
import { Raffle, Winner } from '@/types/raffle';
import { sounds } from '@/lib/sound';
import { generateWhatsAppLink } from '@/lib/pix';
import confetti from 'canvas-confetti';
import { Gift, Sparkles, Trophy, Award, Send } from 'lucide-react';

interface DrawModalProps {
  raffle: Raffle;
  onClose: () => void;
  onSaveWinner: (winner: Winner) => void;
}

export const DrawModal: React.FC<DrawModalProps> = ({ raffle, onSaveWinner }) => {
  const [selectedPrizeOrder, setSelectedPrizeOrder] = useState<number>(1);
  const [onlyPaid, setOnlyPaid] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);

  const eligibleNumbers = React.useMemo(() => {
    return Object.values(raffle.numbers).filter((n) => {
      if (onlyPaid) {
        return n.status === 'paid';
      }
      return n.status === 'paid' || n.status === 'reserved';
    });
  }, [raffle.numbers, onlyPaid]);

  const activePrize = raffle.prizes.find((p) => p.order === selectedPrizeOrder) || raffle.prizes[0];

  const handleStartDraw = () => {
    if (eligibleNumbers.length === 0) {
      alert('Não há cotas elegíveis para realizar o sorteio!');
      return;
    }

    setIsDrawing(true);
    setCurrentWinner(null);
    sounds.playPop();

    let counter = 0;
    const totalTicks = 35;
    let speed = 40;

    const interval = () => {
      counter++;
      const randomItem = eligibleNumbers[Math.floor(Math.random() * eligibleNumbers.length)];
      setDisplayNumber(randomItem.number);
      sounds.playTick();

      if (counter < totalTicks) {
        // Slow down toward the end
        if (counter > 20) speed += 15;
        if (counter > 28) speed += 35;
        setTimeout(interval, speed);
      } else {
        // Final pick
        const finalWinnerItem = eligibleNumbers[Math.floor(Math.random() * eligibleNumbers.length)];
        setDisplayNumber(finalWinnerItem.number);
        setIsDrawing(false);

        const newWinner: Winner = {
          prizeOrder: activePrize.order,
          prizeTitle: `${activePrize.title} - ${activePrize.description}`,
          number: finalWinnerItem.number,
          winnerName: finalWinnerItem.buyerName || `Participante Cota ${finalWinnerItem.number}`,
          winnerPhone: finalWinnerItem.buyerPhone || '',
          sellerName: finalWinnerItem.sellerName,
          drawnAt: new Date().toISOString(),
        };

        setCurrentWinner(newWinner);
        onSaveWinner(newWinner);
        sounds.playFanfare();

        // Confetti explosion in natural warm tones
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D48166', '#5A5A40', '#eee4db', '#3d4b3d', '#ffffff'],
        });
      }
    };

    setTimeout(interval, speed);
  };

  const handleSendWinnerWhatsApp = () => {
    if (!currentWinner || !currentWinner.winnerPhone) return;

    const msg = `🎉 *PARABÉNS! VOCÊ FOI O GANHADOR DA ${raffle.title}!* 🎉\n\n` +
      `🏆 *Prêmio Ganho:* ${currentWinner.prizeTitle}\n` +
      `🎟️ *Cota Sorteada:* [ ${currentWinner.number.toString().padStart(2, '0')} ]\n` +
      `👤 *Ganhador:* ${currentWinner.winnerName}\n` +
      `🤝 *Vendedor:* ${currentWinner.sellerName || 'Comissão'}\n\n` +
      `Entre em contato com a coordenação para retirar o seu prêmio! Que São José abençoe! 🙏✨`;

    const link = generateWhatsAppLink({ phone: currentWinner.winnerPhone, message: msg });
    window.open(link, '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Draw Header */}
      <div className="bg-[#5A5A40] text-white rounded-3xl p-6 shadow-md border border-[#484832] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#484832] text-white flex items-center justify-center font-black shadow-xs border border-white/20">
            <Trophy className="w-8 h-8 text-[#fdfaf7]" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold bg-[#484832] text-white px-3 py-1 rounded-full border border-white/20">
              Auditável & Ao Vivo
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-tight mt-1">
              Sorteador Eletrônico da Rifa
            </h2>
            <p className="text-xs font-semibold text-[#e6dfd8]">{raffle.title}</p>
          </div>
        </div>
      </div>

      {/* Main Draw Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config & Prize Selector */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#eee4db] shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-2">
              Escolha o Prêmio a Sortear:
            </label>
            <div className="space-y-2">
              {raffle.prizes.map((p) => {
                const isSelected = p.order === selectedPrizeOrder;
                const previousWinner = raffle.winners?.find((w) => w.prizeOrder === p.order);

                return (
                  <button
                    key={p.order}
                    onClick={() => {
                      setSelectedPrizeOrder(p.order);
                      setCurrentWinner(previousWinner || null);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#fdf1eb] border-[#D48166] shadow-xs ring-2 ring-[#f0c3b4]'
                        : 'bg-[#f8f5f0] border-[#eee4db] hover:bg-[#eee4db]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-black mb-1">
                      <span className={isSelected ? 'text-[#D48166]' : 'text-[#423d38]'}>
                        {p.title || `${p.order}º Prêmio`}
                      </span>
                      {previousWinner && (
                        <span className="text-[10px] bg-[#f0f4ee] text-[#3d4b3d] font-bold px-2 py-0.5 rounded-full border border-[#d1dec8]">
                          Sorteado (Cota {previousWinner.number})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7c736a] font-medium line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#eee4db]">
            <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1.5">
              Filtro de Participação:
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-[#f8f5f0] rounded-xl border border-[#eee4db] text-xs">
              <input
                type="checkbox"
                id="onlyPaidCheck"
                checked={onlyPaid}
                onChange={(e) => setOnlyPaid(e.target.checked)}
                className="w-4 h-4 text-[#5A5A40] rounded focus:ring-[#5A5A40]"
              />
              <label htmlFor="onlyPaidCheck" className="font-semibold text-[#2d2a26] cursor-pointer">
                Sortear apenas entre cotas PAGAS ({eligibleNumbers.length} cotas)
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Animated Rolling Drum & Winner Announcement */}
        <div className="lg:col-span-8 bg-[#2d2a26] text-white rounded-3xl p-6 sm:p-8 border-2 border-[#5A5A40] shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Background subtle glow */}
          <div className="absolute w-72 h-72 bg-[#D48166]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Selected Prize Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D48166] text-white rounded-full text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>Sorteando: {activePrize.title}</span>
          </div>

          <h3 className="text-sm sm:text-base font-medium text-[#e6dfd8] max-w-md mb-6">
            {activePrize.description}
          </h3>

          {/* Animated Big Number Display */}
          <div className="relative my-4">
            <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl bg-[#1e1c1a] border-2 border-[#D48166] shadow-inner flex flex-col items-center justify-center p-4">
              <span className="text-6xl sm:text-7xl font-mono font-black text-[#D48166] tracking-tight">
                {displayNumber !== null ? displayNumber.toString().padStart(2, '0') : '??'}
              </span>
              <span className="text-[11px] uppercase tracking-widest text-[#a89d91] font-bold mt-1">
                {isDrawing ? 'Sorteando...' : 'Cota da Sorte'}
              </span>
            </div>

            {/* Glowing Corner Accents */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-[#D48166] rounded-tl-lg" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-[#D48166] rounded-br-lg" />
          </div>

          {/* Trigger Button */}
          <button
            onClick={handleStartDraw}
            disabled={isDrawing || eligibleNumbers.length === 0}
            className="mt-4 px-8 py-4 bg-[#D48166] hover:bg-[#c27055] disabled:opacity-50 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          >
            <Gift className="w-5 h-5" />
            <span>{isDrawing ? 'Sorteando Agora...' : 'Girar Roleta do Sorteio'}</span>
          </button>

          {/* Winner Showcase Card */}
          {currentWinner && (
            <div className="mt-6 w-full max-w-md bg-white text-[#2d2a26] rounded-2xl p-5 border border-[#eee4db] shadow-xl animate-slide-up text-left">
              <div className="flex items-center justify-between border-b border-[#eee4db] pb-2 mb-3">
                <div className="flex items-center gap-2 text-[#5A5A40] font-black text-sm">
                  <Trophy className="w-5 h-5 text-[#D48166]" />
                  <span>GANHADOR OFICIAL!</span>
                </div>
                <span className="font-mono text-xs bg-[#fdf1eb] text-[#D48166] px-2 py-0.5 rounded font-bold border border-[#f0c3b4]">
                  Cota nº {currentWinner.number.toString().padStart(2, '0')}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-[#7c736a]">Nome do Ganhador:</span>
                  <div className="text-base font-bold text-[#2d2a26]">{currentWinner.winnerName}</div>
                </div>
                {currentWinner.winnerPhone && (
                  <div>
                    <span className="text-[#7c736a]">WhatsApp / Contato:</span>
                    <div className="font-mono font-semibold text-[#423d38]">{currentWinner.winnerPhone}</div>
                  </div>
                )}
                {currentWinner.sellerName && (
                  <div>
                    <span className="text-[#7c736a]">Vendido por:</span>
                    <div className="font-semibold text-[#423d38]">{currentWinner.sellerName}</div>
                  </div>
                )}
              </div>

              {currentWinner.winnerPhone && (
                <button
                  onClick={handleSendWinnerWhatsApp}
                  className="mt-3 w-full py-2.5 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Parabenizar Ganhador no WhatsApp</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History of Drawn Winners */}
      {raffle.winners && raffle.winners.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#eee4db] shadow-xs space-y-3">
          <h3 className="font-serif font-black text-base text-[#2d2a26] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D48166]" />
            <span>Histórico de Ganhadores Registrados</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {raffle.winners.map((w, idx) => (
              <div key={idx} className="p-3 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#D48166]">{w.prizeTitle}</span>
                  <div className="font-black text-[#2d2a26] text-sm mt-0.5">{w.winnerName}</div>
                  <div className="text-[#7c736a] text-[11px]">
                    {w.winnerPhone} {w.sellerName ? `• Vendedor: ${w.sellerName}` : ''}
                  </div>
                </div>

                <div className="w-12 h-12 rounded-xl bg-[#5A5A40] text-white font-mono font-black text-lg flex items-center justify-center shrink-0 border border-[#484832]">
                  {w.number.toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
