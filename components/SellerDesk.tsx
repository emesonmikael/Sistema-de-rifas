'use client';

import React, { useState, useMemo } from 'react';
import { Raffle, Seller, RaffleNumber } from '@/types/raffle';
import { formatCurrency, generateWhatsAppLink } from '@/lib/pix';
import { sounds } from '@/lib/sound';
import {
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  QrCode,
  DollarSign,
  TrendingUp,
  Receipt,
  Search,
  Check,
  Ticket,
} from 'lucide-react';

interface SellerDeskProps {
  raffle: Raffle;
  sellers: Seller[];
  currentSellerId?: string;
  onSelectSeller: (sellerId: string) => void;
  onConfirmPayment: (number: number) => void;
  onReleaseNumber: (number: number) => void;
  onRegisterSale: (payload: {
    numbers: number[];
    buyerName: string;
    buyerPhone: string;
    sellerId: string;
    sellerName: string;
    paymentMethod: RaffleNumber['paymentMethod'];
    isPaid: boolean;
  }) => void;
  onOpenReceipt: (numberData: RaffleNumber) => void;
}

export const SellerDesk: React.FC<SellerDeskProps> = ({
  raffle,
  sellers,
  currentSellerId,
  onSelectSeller,
  onConfirmPayment,
  onReleaseNumber,
  onRegisterSale,
  onOpenReceipt,
}) => {
  const activeSeller = sellers.find((s) => s.id === currentSellerId) || sellers[0];

  // Fast sell form state
  const [selectedNums, setSelectedNums] = useState<number[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<RaffleNumber['paymentMethod']>('PIX');
  const [isPaidImmediately, setIsPaidImmediately] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Get numbers associated with this seller
  const sellerNumbers = useMemo(() => {
    return Object.values(raffle.numbers).filter(
      (n) => n.sellerId === activeSeller?.id || (!n.sellerId && n.status === 'available')
    );
  }, [raffle.numbers, activeSeller?.id]);

  const soldBySeller = useMemo(() => {
    return Object.values(raffle.numbers).filter(
      (n) => n.sellerId === activeSeller?.id && n.status === 'paid'
    );
  }, [raffle.numbers, activeSeller?.id]);

  const reservedBySeller = useMemo(() => {
    return Object.values(raffle.numbers).filter(
      (n) => n.sellerId === activeSeller?.id && n.status === 'reserved'
    );
  }, [raffle.numbers, activeSeller?.id]);

  const cashInHand = useMemo(() => {
    return soldBySeller
      .filter((n) => n.paymentMethod === 'DINHEIRO')
      .reduce((acc, curr) => acc + (curr.amountPaid || raffle.pricePerNumber), 0);
  }, [soldBySeller, raffle.pricePerNumber]);

  const pixCollected = useMemo(() => {
    return soldBySeller
      .filter((n) => n.paymentMethod === 'PIX')
      .reduce((acc, curr) => acc + (curr.amountPaid || raffle.pricePerNumber), 0);
  }, [soldBySeller, raffle.pricePerNumber]);

  const totalCollected = soldBySeller.length * raffle.pricePerNumber;
  const targetProgress = Math.min(
    100,
    Math.round((soldBySeller.length / (activeSeller?.targetNumbers || 20)) * 100)
  );

  const availableNumbers = useMemo(() => {
    return Object.values(raffle.numbers)
      .filter((n) => n.status === 'available')
      .map((n) => n.number);
  }, [raffle.numbers]);

  const handleToggleFastNum = (num: number) => {
    sounds.playPop();
    if (selectedNums.includes(num)) {
      setSelectedNums(selectedNums.filter((n) => n !== num));
    } else {
      setSelectedNums([...selectedNums, num]);
    }
  };

  const handleRegisterFastSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNums.length === 0) {
      alert('Selecione pelo menos um número disponível para a venda.');
      return;
    }
    if (!buyerName.trim()) {
      alert('Informe o nome do comprador.');
      return;
    }

    onRegisterSale({
      numbers: selectedNums,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      sellerId: activeSeller.id,
      sellerName: activeSeller.name,
      paymentMethod,
      isPaid: isPaidImmediately,
    });

    sounds.playSuccess();
    setSuccessToast(`Venda registrada com sucesso para ${buyerName}!`);
    setSelectedNums([]);
    setBuyerName('');
    setBuyerPhone('');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSendReminder = (item: RaffleNumber) => {
    if (!item.buyerPhone) return;
    const msg = `Olá, ${item.buyerName}! Lembrete da sua reserva da cota *${item.number.toString().padStart(2, '0')}* na *${raffle.title}*.\n\n` +
      `💰 Valor: ${formatCurrency(raffle.pricePerNumber)}\n` +
      `🔑 Chave PIX: ${raffle.pixKey}\n\n` +
      `Podemos confirmar seu bilhete? Deus abençoe! 🙏`;

    const link = generateWhatsAppLink({ phone: item.buyerPhone, message: msg });
    window.open(link, '_blank');
  };

  const handleSendPaidReceipt = (item: RaffleNumber) => {
    if (!item.buyerPhone) return;
    const msg = `🎉 *BILHETE CONFIRMADO - ${raffle.title}* 🎉\n\n` +
      `👤 *Comprador:* ${item.buyerName}\n` +
      `🎟️ *Cota da Sorte:* [ ${item.number.toString().padStart(2, '0')} ]\n` +
      `💰 *Valor Pago:* ${formatCurrency(raffle.pricePerNumber)} (${item.paymentMethod || 'PIX'})\n` +
      `🤝 *Vendedor:* ${activeSeller?.name}\n` +
      `📅 *Data do Sorteio:* ${raffle.drawDate ? new Date(raffle.drawDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}\n\n` +
      `Boa sorte e muito obrigado por apoiar a nossa capela! 🙏✨`;

    const link = generateWhatsAppLink({ phone: item.buyerPhone, message: msg });
    window.open(link, '_blank');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Seller Header & Switcher */}
      <div className="bg-[#5A5A40] text-white rounded-3xl p-5 sm:p-6 border border-[#484832] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#484832] flex items-center justify-center text-white font-black text-xl shadow-xs border border-white/20">
            {activeSeller?.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-white bg-[#484832] px-2.5 py-0.5 rounded-full border border-white/20">
                {activeSeller?.role === 'admin' ? 'Coordenador / Admin' : 'Vendedor Credenciado'}
              </span>
              <span className="text-xs text-[#e6dfd8]">Balcão de Vendas</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight mt-0.5">
              {activeSeller?.name}
            </h2>
            <p className="text-xs text-[#e6dfd8] font-mono">
              WhatsApp: {activeSeller?.phone}
            </p>
          </div>
        </div>

        {/* Switch Seller Profile */}
        <div className="w-full md:w-auto bg-[#484832] p-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="text-xs text-[#e6dfd8]">Trocar Vendedor:</div>
          <select
            value={activeSeller?.id}
            onChange={(e) => onSelectSeller(e.target.value)}
            className="bg-[#3b3b28] text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 focus:ring-2 focus:ring-[#D48166] focus:outline-none"
          >
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role === 'admin' ? 'Coord.' : 'Vendedor'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seller Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Sold */}
        <div className="bg-white rounded-2xl p-4 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7c736a] font-semibold mb-1">
            <span>Cotas Vendidas</span>
            <Ticket className="w-4 h-4 text-[#5A5A40]" />
          </div>
          <div className="text-2xl font-black text-[#2d2a26] font-mono">
            {soldBySeller.length}{' '}
            <span className="text-xs font-normal text-[#7c736a]">/ meta {activeSeller?.targetNumbers || 20}</span>
          </div>
          <div className="mt-2 w-full bg-[#f8f5f0] rounded-full h-2 overflow-hidden border border-[#eee4db]">
            <div
              className="bg-[#5A5A40] h-full rounded-full transition-all"
              style={{ width: `${targetProgress}%` }}
            />
          </div>
          <span className="text-[10px] text-[#7c736a] mt-1 block">
            {targetProgress}% da meta atingida
          </span>
        </div>

        {/* Metric 2: Total Collected */}
        <div className="bg-white rounded-2xl p-4 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7c736a] font-semibold mb-1">
            <span>Total Arrecadado</span>
            <DollarSign className="w-4 h-4 text-[#D48166]" />
          </div>
          <div className="text-2xl font-black text-[#5A5A40] font-mono">
            {formatCurrency(totalCollected)}
          </div>
          <span className="text-[11px] text-[#7c736a] mt-2 block">
            {soldBySeller.length} cotas confirmadas
          </span>
        </div>

        {/* Metric 3: Cash in Hand */}
        <div className="bg-[#fdf1eb] rounded-2xl p-4 border border-[#f0c3b4] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#D48166] font-bold mb-1">
            <span>Dinheiro em Espécie</span>
            <TrendingUp className="w-4 h-4 text-[#D48166]" />
          </div>
          <div className="text-2xl font-black text-[#b35c43] font-mono">
            {formatCurrency(cashInHand)}
          </div>
          <span className="text-[10px] text-[#b35c43] mt-1 block font-medium">
            Repassar para a Tesouraria Paroquial
          </span>
        </div>

        {/* Metric 4: PIX Collected */}
        <div className="bg-[#f0f4ee] rounded-2xl p-4 border border-[#d1dec8] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#3d4b3d] font-bold mb-1">
            <span>Recebido via PIX</span>
            <QrCode className="w-4 h-4 text-[#5A5A40]" />
          </div>
          <div className="text-2xl font-black text-[#3d4b3d] font-mono">
            {formatCurrency(pixCollected)}
          </div>
          <span className="text-[10px] text-[#3d4b3d] mt-1 block font-medium">
            Direto na conta da Capela
          </span>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-[#f0f4ee] border border-[#d1dec8] rounded-2xl text-[#3d4b3d] font-bold text-sm flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#5A5A40] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Two-Column Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Sales Terminal */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#eee4db] shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#eee4db]">
            <div className="w-8 h-8 rounded-xl bg-[#f0f4ee] text-[#5A5A40] flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2d2a26] text-base">Registrar Nova Venda</h3>
              <p className="text-xs text-[#7c736a]">Marcar número vendido e emitir recibo digital</p>
            </div>
          </div>

          <form onSubmit={handleRegisterFastSale} className="space-y-4">
            {/* Quick Number Selector Chips */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#423d38] mb-1.5">
                <span>SELECIONE OS NÚMEROS LIVRES:</span>
                <span className="text-[#5A5A40]">{availableNumbers.length} disponíveis</span>
              </div>

              <div className="max-h-36 overflow-y-auto p-2 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] grid grid-cols-6 gap-1.5">
                {availableNumbers.map((num) => {
                  const isChecked = selectedNums.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleToggleFastNum(num)}
                      className={`h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center ${
                        isChecked
                          ? 'bg-[#D48166] text-white ring-2 ring-[#f0c3b4] scale-105 shadow-xs'
                          : 'bg-white text-[#2d2a26] border border-[#eee4db] hover:border-[#5A5A40] hover:bg-[#fdfaf7]'
                      }`}
                    >
                      {num.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              {selectedNums.length > 0 && (
                <div className="mt-2 text-xs text-[#423d38] bg-[#fdf1eb] p-2 rounded-xl border border-[#f0c3b4] flex items-center justify-between">
                  <span className="font-semibold">
                    Selecionados: {selectedNums.sort((a, b) => a - b).map((n) => n.toString().padStart(2, '0')).join(', ')}
                  </span>
                  <span className="font-black text-[#D48166]">
                    {formatCurrency(selectedNums.length * raffle.pricePerNumber)}
                  </span>
                </div>
              )}
            </div>

            {/* Buyer Info */}
            <div>
              <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                Nome do Comprador <span className="text-[#D48166]">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Dona Maria do Socorro"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="tel"
                placeholder="(88) 99999-9999"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['PIX', 'DINHEIRO', 'CARTAO'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      paymentMethod === method
                        ? 'bg-[#5A5A40] text-white border-[#484832] shadow-xs'
                        : 'bg-[#f8f5f0] text-[#423d38] border-[#eee4db] hover:bg-[#ede6df]'
                    }`}
                  >
                    {method === 'PIX' ? '⚡ PIX' : method === 'DINHEIRO' ? '💵 Dinheiro' : '💳 Cartão'}
                  </button>
                ))}
              </div>
            </div>

            {/* Immediate Paid Checkbox */}
            <div className="flex items-center gap-2 p-3 bg-[#f8f5f0] rounded-xl border border-[#eee4db]">
              <input
                type="checkbox"
                id="immediateCheck"
                checked={isPaidImmediately}
                onChange={(e) => setIsPaidImmediately(e.target.checked)}
                className="w-4 h-4 text-[#5A5A40] rounded focus:ring-[#5A5A40]"
              />
              <label htmlFor="immediateCheck" className="text-xs font-bold text-[#2d2a26] cursor-pointer">
                Pagamento já recebido (Marcar como PAGO imediatamente)
              </label>
            </div>

            <button
              type="submit"
              disabled={selectedNums.length === 0}
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#484832] disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirmar Venda ({selectedNums.length} cota{selectedNums.length > 1 ? 's' : ''})</span>
            </button>
          </form>
        </div>

        {/* Right Column: Manage Seller's Registered Numbers */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#eee4db] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eee4db]">
            <div>
              <h3 className="font-bold text-[#2d2a26] text-base">Cotas deste Vendedor</h3>
              <p className="text-xs text-[#7c736a]">
                {soldBySeller.length} pagas • {reservedBySeller.length} aguardando pagamento
              </p>
            </div>

            {/* Search filter for this table */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#a89d91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome/número..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A5A40] text-[#2d2a26]"
              />
            </div>
          </div>

          {/* Numbers Table */}
          <div className="max-h-[480px] overflow-y-auto rounded-2xl border border-[#eee4db]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#5A5A40] text-white sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 font-mono">Nº</th>
                  <th className="py-2.5 px-3">Comprador</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Pagamento</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee4db] bg-white">
                {Object.values(raffle.numbers)
                  .filter((n) => {
                    if (n.sellerId !== activeSeller?.id) return false;
                    if (filterQuery.trim()) {
                      const q = filterQuery.toLowerCase();
                      return (
                        n.number.toString().includes(q) ||
                        (n.buyerName || '').toLowerCase().includes(q) ||
                        (n.buyerPhone || '').toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .sort((a, b) => a.number - b.number)
                  .map((item) => {
                    const isPaid = item.status === 'paid';

                    return (
                      <tr key={item.number} className="hover:bg-[#fdfaf7] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-black text-[#2d2a26] text-sm">
                          {item.number.toString().padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#2d2a26]">{item.buyerName || 'Sem nome'}</div>
                          <div className="text-[11px] text-[#7c736a] font-mono">{item.buyerPhone || 'Sem telefone'}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f0f4ee] text-[#3d4b3d] font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-[#5A5A40]" />
                              PAGO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fdf1eb] text-[#D48166] font-bold text-[10px]">
                              <Clock className="w-3 h-3 text-[#D48166]" />
                              RESERVA
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[#423d38]">
                            {formatCurrency(raffle.pricePerNumber)}
                          </span>
                          <span className="text-[10px] text-[#7c736a] block">
                            {item.paymentMethod || 'PIX'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Action: Open Digital Ticket */}
                            <button
                              onClick={() => onOpenReceipt(item)}
                              className="p-1.5 text-[#423d38] hover:bg-[#f8f5f0] rounded-lg transition-colors"
                              title="Visualizar Bilhete Digital"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>

                            {/* Action: Confirm Payment */}
                            {!isPaid && (
                              <button
                                onClick={() => {
                                  sounds.playSuccess();
                                  onConfirmPayment(item.number);
                                }}
                                className="px-2 py-1 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold rounded-lg text-[11px] transition-colors"
                                title="Confirmar pagamento recebido"
                              >
                                Confirmar
                              </button>
                            )}

                            {/* WhatsApp Notification */}
                            {item.buyerPhone && (
                              <button
                                onClick={() => isPaid ? handleSendPaidReceipt(item) : handleSendReminder(item)}
                                className="p-1.5 text-[#5A5A40] hover:bg-[#f0f4ee] rounded-lg transition-colors"
                                title={isPaid ? 'Enviar recibo no WhatsApp' : 'Cobrar pelo WhatsApp'}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            {/* Release Number */}
                            {!isPaid && (
                              <button
                                onClick={() => {
                                  if (confirm(`Deseja cancelar a reserva do número ${item.number}?`)) {
                                    onReleaseNumber(item.number);
                                  }
                                }}
                                className="px-1.5 py-1 text-[#D48166] hover:bg-[#fdf1eb] rounded text-[11px] font-semibold"
                                title="Cancelar reserva e liberar número"
                              >
                                Liberar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
