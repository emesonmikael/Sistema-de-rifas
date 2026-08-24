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
  UserPlus,
} from 'lucide-react';

interface SellerDeskProps {
  raffle: Raffle;
  sellers: Seller[];
  currentSellerId?: string;
  isAdmin?: boolean;
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
  onOpenSellerManager?: () => void;
}

export const SellerDesk: React.FC<SellerDeskProps> = ({
  raffle,
  sellers,
  currentSellerId,
  isAdmin,
  onSelectSeller,
  onConfirmPayment,
  onReleaseNumber,
  onRegisterSale,
  onOpenReceipt,
  onOpenSellerManager,
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

  // Numbers associated with this seller
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
    if (selectedNums.includes(num)) {
      setSelectedNums(selectedNums.filter((n) => n !== num));
    } else {
      setSelectedNums([...selectedNums, num]);
    }
    sounds.playPop();
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
    const msg =
      `Olá, ${item.buyerName}! Lembrete da sua reserva da cota *${item.number.toString().padStart(2, '0')}* na *${raffle.title}*.\n\n` +
      `💰 Valor: ${formatCurrency(raffle.pricePerNumber)}\n` +
      `🔑 Chave PIX: ${raffle.pixKey}\n\n` +
      `Podemos confirmar seu bilhete? Deus abençoe! 🙏`;

    const link = generateWhatsAppLink({ phone: item.buyerPhone, message: msg });
    if (typeof window !== 'undefined') {
      window.location.assign(link);
    }
  };

  const handleSendPaidReceipt = (item: RaffleNumber) => {
    if (!item.buyerPhone) return;
    const msg =
      `🎉 *BILHETE CONFIRMADO - ${raffle.title}* 🎉\n\n` +
      `👤 *Comprador:* ${item.buyerName}\n` +
      `🎟️ *Cota da Sorte:* [ ${item.number.toString().padStart(2, '0')} ]\n` +
      `💰 *Valor Pago:* ${formatCurrency(raffle.pricePerNumber)} (${item.paymentMethod || 'PIX'})\n` +
      `🤝 *Vendedor:* ${activeSeller?.name}\n` +
      `📅 *Data do Sorteio:* ${raffle.drawDate ? new Date(raffle.drawDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}\n\n` +
      `Boa sorte e muito obrigado por apoiar a nossa capela! 🙏✨`;

    const link = generateWhatsAppLink({ phone: item.buyerPhone, message: msg });
    if (typeof window !== 'undefined') {
      window.location.assign(link);
    }
  };

  // Filter list
  const activeSellerNumbers = useMemo(() => {
    return Object.values(raffle.numbers)
      .filter((n) => n.sellerId === activeSeller?.id)
      .filter((n) => {
        if (!filterQuery.trim()) return true;
        const q = filterQuery.toLowerCase().trim();
        const numPad = n.number.toString().padStart(2, '0');
        const buyer = (n.buyerName || '').toLowerCase();
        const phone = (n.buyerPhone || '').toLowerCase();
        return n.number.toString().includes(q) || numPad.includes(q) || buyer.includes(q) || phone.includes(q);
      })
      .sort((a, b) => a.number - b.number);
  }, [raffle.numbers, activeSeller?.id, filterQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-12">
      {/* Seller Header & Switcher */}
      <div className="bg-[#5A5A40] text-white rounded-3xl p-4 sm:p-6 border border-[#484832] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#484832] flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-xs border border-white/20 shrink-0">
            {activeSeller?.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-white bg-[#484832] px-2 py-0.5 rounded-full border border-white/20">
                {activeSeller?.role === 'admin' ? 'Coordenador / Admin' : 'Vendedor Credenciado'}
              </span>
              <span className="text-[10px] sm:text-xs text-[#e6dfd8]">Balcão de Vendas</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white font-serif tracking-tight mt-0.5 truncate">
              {activeSeller?.name}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#e6dfd8] font-mono">
              WhatsApp: {activeSeller?.phone}
            </p>
          </div>
        </div>

        {/* Switch Seller Profile & Manage Sellers */}
        <div className="w-full md:w-auto bg-[#484832] p-2.5 sm:p-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between md:justify-start gap-2">
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <div className="text-xs text-[#e6dfd8] whitespace-nowrap">Vendedor:</div>
            <select
              value={activeSeller?.id}
              onChange={(e) => onSelectSeller(e.target.value)}
              className="flex-1 md:flex-none bg-[#3b3b28] text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20 focus:ring-2 focus:ring-[#D48166] focus:outline-none"
            >
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role === 'admin' ? 'Coord.' : 'Vendedor'})
                </option>
              ))}
            </select>
          </div>

          {onOpenSellerManager && (
            <button
              type="button"
              onClick={onOpenSellerManager}
              className="px-3 py-2 bg-[#5A5A40] hover:bg-[#484832] text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs whitespace-nowrap"
              title="Cadastrar novo vendedor ou alterar metas"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAdmin ? '+ Cadastrar Vendedor' : 'Equipe'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Seller Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Total Sold */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7c736a] font-semibold mb-1">
            <span>Cotas Vendidas</span>
            <Ticket className="w-4 h-4 text-[#5A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2d2a26] font-mono">
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
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7c736a] font-semibold mb-1">
            <span>Total Arrecadado</span>
            <DollarSign className="w-4 h-4 text-[#D48166]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#5A5A40] font-mono">
            {formatCurrency(totalCollected)}
          </div>
          <span className="text-[11px] text-[#7c736a] mt-2 block">
            {soldBySeller.length} cotas confirmadas
          </span>
        </div>

        {/* Metric 3: Cash in Hand */}
        <div className="bg-[#fdf1eb] rounded-2xl p-3.5 sm:p-4 border border-[#f0c3b4] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#D48166] font-bold mb-1">
            <span>Em Espécie</span>
            <TrendingUp className="w-4 h-4 text-[#D48166]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#b35c43] font-mono">
            {formatCurrency(cashInHand)}
          </div>
          <span className="text-[10px] text-[#b35c43] mt-1 block font-medium">
            Dinheiro a repassar
          </span>
        </div>

        {/* Metric 4: PIX Collected */}
        <div className="bg-[#f0f4ee] rounded-2xl p-3.5 sm:p-4 border border-[#d1dec8] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#3d4b3d] font-bold mb-1">
            <span>Recebido via PIX</span>
            <QrCode className="w-4 h-4 text-[#5A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#3d4b3d] font-mono">
            {formatCurrency(pixCollected)}
          </div>
          <span className="text-[10px] text-[#3d4b3d] mt-1 block font-medium">
            Direto na conta oficial
          </span>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 sm:p-4 bg-[#f0f4ee] border border-[#d1dec8] rounded-2xl text-[#3d4b3d] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#5A5A40] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Two-Column Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: Quick Sales Terminal */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-6 border border-[#eee4db] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#eee4db]">
            <div className="w-8 h-8 rounded-xl bg-[#f0f4ee] text-[#5A5A40] flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2d2a26] text-base">Registrar Nova Venda</h3>
              <p className="text-xs text-[#7c736a]">Marcar número vendido e emitir recibo</p>
            </div>
          </div>

          <form onSubmit={handleRegisterFastSale} className="space-y-3.5">
            {/* Quick Number Selector Chips */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#423d38] mb-1.5">
                <span>SELECIONE OS NÚMEROS LIVRES:</span>
                <span className="text-[#5A5A40]">{availableNumbers.length} disponíveis</span>
              </div>

              <div className="max-h-40 overflow-y-auto p-2 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                {availableNumbers.map((num) => {
                  const isChecked = selectedNums.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleToggleFastNum(num)}
                      className={`h-10 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center active:scale-95 ${
                        isChecked
                          ? 'bg-[#D48166] text-white ring-2 ring-[#f0c3b4] scale-105 shadow-xs'
                          : 'bg-white text-[#2d2a26] border border-[#eee4db] hover:border-[#5A5A40] active:bg-[#fdfaf7]'
                      }`}
                    >
                      {num.toString().padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              {selectedNums.length > 0 && (
                <div className="mt-2 text-xs text-[#423d38] bg-[#fdf1eb] p-2 rounded-xl border border-[#f0c3b4] flex items-center justify-between">
                  <span className="font-semibold truncate max-w-[180px]">
                    Marcados: {selectedNums.sort((a, b) => a - b).map((n) => n.toString().padStart(2, '0')).join(', ')}
                  </span>
                  <span className="font-black text-[#D48166] shrink-0">
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
                placeholder="Ex: Maria das Graças"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3.5 py-3 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
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
                className="w-full px-3.5 py-3 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1.5">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['PIX', 'DINHEIRO', 'CARTAO'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method);
                      sounds.playPop();
                    }}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all active:scale-95 ${
                      paymentMethod === method
                        ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                        : 'bg-[#f8f5f0] text-[#7c736a] border-[#eee4db] hover:bg-[#eee4db]'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Immediate Payment Switch */}
            <div className="flex items-center gap-2.5 p-3 bg-[#f8f5f0] rounded-xl border border-[#eee4db]">
              <input
                type="checkbox"
                id="fastPaidCheck"
                checked={isPaidImmediately}
                onChange={(e) => setIsPaidImmediately(e.target.checked)}
                className="w-5 h-5 text-[#5A5A40] rounded focus:ring-[#5A5A40]"
              />
              <label htmlFor="fastPaidCheck" className="text-xs font-bold text-[#2d2a26] cursor-pointer select-none">
                Já recebeu o valor? (Confirmar como PAGO)
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#D48166] hover:bg-[#c27055] text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirmar Registro de Venda</span>
            </button>
          </form>
        </div>

        {/* Right Column: Numbers Managed by this Seller */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-6 border border-[#eee4db] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#eee4db]">
            <div>
              <h3 className="font-bold text-[#2d2a26] text-base">Minhas Cotas Registradas</h3>
              <p className="text-xs text-[#7c736a]">
                {activeSellerNumbers.length} cotas vinculadas ({reservedBySeller.length} reservadas, {soldBySeller.length} pagas)
              </p>
            </div>

            {/* Filter Search */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#a89d91] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cota..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A5A40] text-[#2d2a26]"
              />
            </div>
          </div>

          {/* List of Numbers */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {activeSellerNumbers.map((item) => {
              const isPaid = item.status === 'paid';
              return (
                <div
                  key={item.number}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isPaid
                      ? 'bg-[#f8f5f0] border-[#eee4db]'
                      : 'bg-[#fdf1eb] border-[#f0c3b4]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl font-mono font-black text-lg flex items-center justify-center shrink-0 shadow-xs ${
                        isPaid ? 'bg-[#5A5A40] text-white' : 'bg-[#D48166] text-white'
                      }`}
                    >
                      {item.number.toString().padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#2d2a26] truncate">
                          {item.buyerName || 'Sem nome registrado'}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isPaid
                              ? 'bg-[#e8f0e8] text-[#3d4b3d]'
                              : 'bg-[#fbe7df] text-[#D48166]'
                          }`}
                        >
                          {isPaid ? 'Pago' : 'Reservado'}
                        </span>
                      </div>
                      <div className="text-xs text-[#7c736a] flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {item.buyerPhone && <span>📱 {item.buyerPhone}</span>}
                        {item.paymentMethod && <span>💳 {item.paymentMethod}</span>}
                        <span>💰 {formatCurrency(item.amountPaid || raffle.pricePerNumber)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this number */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#eee4db]/60">
                    {!isPaid ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onConfirmPayment(item.number);
                            sounds.playSuccess();
                          }}
                          className="flex items-center gap-1 px-3 py-2 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-2xs active:scale-95"
                          title="Confirmar pagamento recebido"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar Pago</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendReminder(item)}
                          className="p-2 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#5A5A40] rounded-xl border border-[#eee4db] active:scale-95"
                          title="Enviar lembrete de PIX no WhatsApp"
                        >
                          <Send className="w-4 h-4 text-[#5A5A40]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Liberar número ${item.number} para outros compradores?`)) {
                              onReleaseNumber(item.number);
                            }
                          }}
                          className="p-2 text-[#b35c43] hover:bg-[#fbe7df] rounded-xl active:scale-95 text-xs font-bold"
                          title="Cancelar e liberar número"
                        >
                          Liberar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(item)}
                          className="flex items-center gap-1 px-3 py-2 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] active:scale-95"
                          title="Visualizar Recibo Oficial"
                        >
                          <Receipt className="w-3.5 h-3.5 text-[#5A5A40]" />
                          <span>Ver Recibo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendPaidReceipt(item)}
                          className="p-2 bg-[#f0f4ee] hover:bg-[#e4ede1] text-[#3d4b3d] rounded-xl border border-[#d1dec8] active:scale-95"
                          title="Reenviar comprovante pelo WhatsApp"
                        >
                          <Send className="w-4 h-4 text-[#5A5A40]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {activeSellerNumbers.length === 0 && (
              <div className="py-12 text-center text-[#7c736a]">
                <Clock className="w-8 h-8 text-[#a89d91] mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhuma cota registrada para este vendedor ainda.</p>
                <p className="text-xs text-[#a89d91] mt-1">
                  Utilize o painel ao lado para registrar suas primeiras vendas!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
