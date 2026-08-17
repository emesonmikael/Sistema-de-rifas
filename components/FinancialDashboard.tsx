'use client';

import React, { useState } from 'react';
import { Raffle, Seller, Expense, RaffleNumber } from '@/types/raffle';
import { formatCurrency, generateWhatsAppLink } from '@/lib/pix';
import { sounds } from '@/lib/sound';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ShieldCheck,
  Download,
  AlertCircle,
  Receipt,
  Layers,
  Send,
  Sparkles,
} from 'lucide-react';

interface FinancialDashboardProps {
  raffle: Raffle;
  sellers: Seller[];
  onConfirmPayment: (number: number) => void;
  onBulkConfirmPayments: (numbers: number[]) => void;
  onReleaseNumber: (number: number) => void;
  onReleaseExpired: () => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  raffle,
  sellers,
  onConfirmPayment,
  onBulkConfirmPayments,
  onReleaseNumber,
  onReleaseExpired,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [selectedPendingNums, setSelectedPendingNums] = useState<number[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Expense form
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('premio');

  // Calculations
  const allNumbers = Object.values(raffle.numbers);
  const paidNumbers = allNumbers.filter((n) => n.status === 'paid');
  const reservedNumbers = allNumbers.filter((n) => n.status === 'reserved');
  const availableCount = raffle.totalNumbers - (paidNumbers.length + reservedNumbers.length);

  const totalConfirmedRevenue = paidNumbers.reduce(
    (acc, curr) => acc + (curr.amountPaid || raffle.pricePerNumber),
    0
  );
  const totalPendingRevenue = reservedNumbers.length * raffle.pricePerNumber;
  const potentialTotalRevenue = raffle.totalNumbers * raffle.pricePerNumber;

  const totalExpenses = (raffle.expenses || []).reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalConfirmedRevenue - totalExpenses;
  const potentialNetProfit = potentialTotalRevenue - totalExpenses;

  // Breakdown by payment method
  const pixRevenue = paidNumbers
    .filter((n) => n.paymentMethod === 'PIX')
    .reduce((acc, curr) => acc + (curr.amountPaid || raffle.pricePerNumber), 0);

  const cashRevenue = paidNumbers
    .filter((n) => n.paymentMethod === 'DINHEIRO')
    .reduce((acc, curr) => acc + (curr.amountPaid || raffle.pricePerNumber), 0);

  const cardRevenue = paidNumbers
    .filter((n) => n.paymentMethod === 'CARTAO')
    .reduce((acc, curr) => acc + (curr.amountPaid || raffle.pricePerNumber), 0);

  // Per-seller performance
  const sellerSummary = sellers.map((seller) => {
    const sellerPaid = paidNumbers.filter((n) => n.sellerId === seller.id);
    const sellerReserved = reservedNumbers.filter((n) => n.sellerId === seller.id);
    const collected = sellerPaid.reduce((acc, n) => acc + (n.amountPaid || raffle.pricePerNumber), 0);
    const cashInHand = sellerPaid
      .filter((n) => n.paymentMethod === 'DINHEIRO')
      .reduce((acc, n) => acc + (n.amountPaid || raffle.pricePerNumber), 0);

    return {
      seller,
      paidCount: sellerPaid.length,
      reservedCount: sellerReserved.length,
      collected,
      cashInHand,
      targetProgress: Math.min(100, Math.round((sellerPaid.length / (seller.targetNumbers || 20)) * 100)),
    };
  });

  const handleToggleSelectPending = (num: number) => {
    if (selectedPendingNums.includes(num)) {
      setSelectedPendingNums(selectedPendingNums.filter((n) => n !== num));
    } else {
      setSelectedPendingNums([...selectedPendingNums, num]);
    }
  };

  const handleSelectAllPending = () => {
    if (selectedPendingNums.length === reservedNumbers.length) {
      setSelectedPendingNums([]);
    } else {
      setSelectedPendingNums(reservedNumbers.map((n) => n.number));
    }
  };

  const handleBulkConfirm = () => {
    if (selectedPendingNums.length === 0) return;
    onBulkConfirmPayments(selectedPendingNums);
    sounds.playSuccess();
    setSelectedPendingNums([]);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount.replace(',', '.'));
    if (!expenseDesc.trim() || isNaN(amountNum) || amountNum <= 0) {
      alert('Preencha a descrição e um valor válido de despesa.');
      return;
    }

    onAddExpense({
      description: expenseDesc.trim(),
      amount: amountNum,
      category: expenseCategory,
      date: new Date().toISOString().split('T')[0],
      registeredBy: 'Tesouraria Paroquial',
    });

    sounds.playSuccess();
    setExpenseDesc('');
    setExpenseAmount('');
    setShowExpenseModal(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#5A5A40] text-white p-4 sm:p-6 rounded-3xl border border-[#484832] shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#484832] flex items-center justify-center font-bold text-white shadow-xs border border-white/20">
            <DollarSign className="w-6 h-6 text-[#fdfaf7]" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-extrabold bg-[#484832] text-white px-2.5 py-0.5 rounded-full border border-white/20">
              Tesouraria & Auditoria
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight mt-0.5">
              Painel Financeiro & Arrecadação
            </h2>
            <p className="text-xs text-[#e6dfd8]">{raffle.title} • {raffle.chapelOrOrgName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D48166] hover:bg-[#c27055] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Lançar Despesa</span>
          </button>
        </div>
      </div>

      {/* Main KPI Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Confirmed Revenue */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7c736a] font-semibold mb-1">
            <span>Arrecadação Confirmada</span>
            <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#5A5A40] font-mono">
            {formatCurrency(totalConfirmedRevenue)}
          </div>
          <div className="text-[11px] text-[#7c736a] mt-1 flex justify-between">
            <span>{paidNumbers.length} cotas pagas</span>
            <span>Meta: {formatCurrency(potentialTotalRevenue)}</span>
          </div>
        </div>

        {/* Card 2: Net Profit (Líquido) */}
        <div className="bg-[#f0f4ee] rounded-2xl p-3.5 sm:p-4 border border-[#d1dec8] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#3d4b3d] font-bold mb-1">
            <span>Saldo Líquido Atual</span>
            <TrendingUp className="w-4 h-4 text-[#5A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#3d4b3d] font-mono">
            {formatCurrency(netProfit)}
          </div>
          <div className="text-[10px] text-[#3d4b3d] mt-1 flex justify-between font-medium">
            <span>Receita - Despesas</span>
            <span>Potencial: {formatCurrency(potentialNetProfit)}</span>
          </div>
        </div>

        {/* Card 3: Pending Reserves */}
        <div className="bg-[#fdf1eb] rounded-2xl p-3.5 sm:p-4 border border-[#f0c3b4] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#D48166] font-bold mb-1">
            <span>Aguardando Pagamento</span>
            <Clock className="w-4 h-4 text-[#D48166]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#D48166] font-mono">
            {formatCurrency(totalPendingRevenue)}
          </div>
          <div className="text-[10px] text-[#b35c43] mt-1 flex justify-between font-medium">
            <span>{reservedNumbers.length} cotas pendentes</span>
            {reservedNumbers.length > 0 && (
              <button
                type="button"
                onClick={onReleaseExpired}
                className="underline hover:text-[#2d2a26]"
              >
                Liberar expiradas
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Total Expenses */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7c736a] font-semibold mb-1">
            <span>Total de Despesas</span>
            <Receipt className="w-4 h-4 text-[#a89d91]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#2d2a26] font-mono">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-[#7c736a] mt-1">
            {(raffle.expenses || []).length} despesas registradas
          </div>
        </div>
      </div>

      {/* Payment Channels Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#eee4db] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[#7c736a] font-semibold">Entradas via PIX Oficial</span>
            <div className="text-lg font-black text-[#5A5A40] font-mono mt-0.5">
              {formatCurrency(pixRevenue)}
            </div>
            <span className="text-[10px] text-[#7c736a]">
              {paidNumbers.filter((n) => n.paymentMethod === 'PIX').length} transferências diretas
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#f0f4ee] text-[#5A5A40] flex items-center justify-center font-bold">
            PIX
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#eee4db] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[#7c736a] font-semibold">Entradas em Dinheiro Físico</span>
            <div className="text-lg font-black text-[#D48166] font-mono mt-0.5">
              {formatCurrency(cashRevenue)}
            </div>
            <span className="text-[10px] text-[#7c736a]">
              {paidNumbers.filter((n) => n.paymentMethod === 'DINHEIRO').length} cotas com vendedores
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#fdf1eb] text-[#D48166] flex items-center justify-center font-bold">
            R$
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#eee4db] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-[#7c736a] font-semibold">Cartão / Outros Meios</span>
            <div className="text-lg font-black text-[#2d2a26] font-mono mt-0.5">
              {formatCurrency(cardRevenue)}
            </div>
            <span className="text-[10px] text-[#7c736a]">
              {paidNumbers.filter((n) => n.paymentMethod === 'CARTAO').length} pagamentos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#f8f5f0] text-[#7c736a] flex items-center justify-center font-bold">
            💳
          </div>
        </div>
      </div>

      {/* Two Column Layout: Pending Audit & Seller Cash Reconcile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Pending Payment Audit Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-6 border border-[#eee4db] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#eee4db]">
            <div>
              <h3 className="font-bold text-base text-[#2d2a26] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#5A5A40]" />
                <span>Auditoria de Cotas Reservadas ({reservedNumbers.length})</span>
              </h3>
              <p className="text-xs text-[#7c736a]">
                Confirme os comprovantes PIX ou pagamentos entregues pelos compradores
              </p>
            </div>

            {reservedNumbers.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllPending}
                  className="px-2.5 py-1 text-xs font-semibold text-[#423d38] bg-[#f8f5f0] hover:bg-[#eee4db] rounded-lg transition-colors active:scale-95"
                >
                  {selectedPendingNums.length === reservedNumbers.length ? 'Desmarcar' : 'Marcar Todos'}
                </button>

                {selectedPendingNums.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkConfirm}
                    className="px-3 py-1 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-lg shadow-xs transition-colors active:scale-95"
                  >
                    Confirmar ({selectedPendingNums.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {reservedNumbers.length === 0 ? (
            <div className="py-12 text-center text-[#7c736a] space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#5A5A40] mx-auto opacity-80" />
              <p className="text-sm font-semibold text-[#2d2a26]">Nenhum pagamento pendente no momento!</p>
              <p className="text-xs">Todas as cotas reservadas já foram auditadas e confirmadas.</p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto rounded-2xl border border-[#eee4db]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#5A5A40] text-white sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedPendingNums.length === reservedNumbers.length && reservedNumbers.length > 0}
                        onChange={handleSelectAllPending}
                        className="rounded text-[#5A5A40]"
                      />
                    </th>
                    <th className="py-2.5 px-3 font-mono">Cota</th>
                    <th className="py-2.5 px-3">Comprador</th>
                    <th className="py-2.5 px-3">Vendedor</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee4db]">
                  {reservedNumbers.map((item) => {
                    const isChecked = selectedPendingNums.includes(item.number);

                    return (
                      <tr key={item.number} className="hover:bg-[#fdfaf7]">
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectPending(item.number)}
                            className="rounded text-[#5A5A40]"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-[#2d2a26]">
                          {item.number.toString().padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#2d2a26]">{item.buyerName || 'Sem nome'}</div>
                          <div className="text-[11px] text-[#7c736a] font-mono">{item.buyerPhone || '—'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[#7c736a]">
                          {item.sellerName || 'Comissão'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playSuccess();
                                onConfirmPayment(item.number);
                              }}
                              className="px-2.5 py-1 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold rounded-lg text-[11px] shadow-xs active:scale-95"
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => onReleaseNumber(item.number)}
                              className="px-2 py-1 text-[#D48166] hover:bg-[#fdf1eb] rounded-lg text-[11px] font-semibold active:scale-95"
                            >
                              Liberar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 text-xs text-[#7c736a]">
            <span>
              Total pendente de confirmação: <strong>{formatCurrency(totalPendingRevenue)}</strong>
            </span>
          </div>
        </div>

        {/* Right: Seller Reconciliation & Cash in Hand */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-6 border border-[#eee4db] shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#eee4db]">
            <h3 className="font-bold text-base text-[#2d2a26]">Prestações de Conta da Equipe</h3>
            <p className="text-xs text-[#7c736a]">Valores em espécie arrecadados por vendedor</p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {sellerSummary.map(({ seller, paidCount, reservedCount, collected, cashInHand, targetProgress }) => (
              <div
                key={seller.id}
                className="p-3.5 rounded-2xl bg-[#f8f5f0] border border-[#eee4db] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#5A5A40] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {seller.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-[#2d2a26] truncate">{seller.name}</div>
                      <div className="text-[10px] text-[#7c736a]">{paidCount} pagas • {reservedCount} reservadas</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-black text-[#5A5A40]">
                      {formatCurrency(collected)}
                    </span>
                    <span className="text-[10px] text-[#7c736a] block">Total vendido</span>
                  </div>
                </div>

                {/* Cash in hand highlight for treasury */}
                <div className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-[#eee4db]">
                  <span className="text-[#b35c43] font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Em dinheiro físico:
                  </span>
                  <span className="font-mono font-black text-[#b35c43]">
                    {formatCurrency(cashInHand)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses Breakdown Box */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#eee4db] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#eee4db]">
          <div>
            <h3 className="font-bold text-base text-[#2d2a26]">Despesas e Custos Registrados</h3>
            <p className="text-xs text-[#7c736a]">Custos de impressão, compras de prêmios e material</p>
          </div>
          <button
            type="button"
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-[#D48166] hover:underline active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Adicionar nova despesa</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(raffle.expenses || []).map((exp) => (
            <div
              key={exp.id}
              className="p-3.5 rounded-2xl bg-[#f8f5f0] border border-[#eee4db] flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <span className="font-bold text-[#2d2a26] block truncate">{exp.description}</span>
                <span className="text-[11px] text-[#7c736a]">{exp.category} • {exp.date}</span>
                <div className="font-mono font-black text-sm text-[#b35c43] mt-1">
                  - {formatCurrency(exp.amount)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Excluir despesa "${exp.description}"?`)) {
                    onDeleteExpense(exp.id);
                  }
                }}
                className="p-2 text-[#b35c43] hover:bg-[#fbe7df] rounded-lg transition-colors active:scale-95 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {(raffle.expenses || []).length === 0 && (
            <div className="col-span-full py-6 text-center text-[#7c736a] text-xs">
              Nenhuma despesa lançada nesta rifa até o momento.
            </div>
          )}
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26]">
            <div className="bg-[#5A5A40] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#484832] shrink-0">
              <h3 className="font-serif font-black text-sm sm:text-base text-white">Lançar Nova Despesa</h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-full text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                  Descrição da Despesa <span className="text-[#D48166]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Compra de cartolina e impressão de bilhetes"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                  Valor da Despesa (R$) <span className="text-[#D48166]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-sm font-bold text-[#2d2a26] focus:ring-2 focus:ring-[#5A5A40] focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider mb-1">
                  Categoria
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                  className="w-full px-3 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-xs sm:text-sm font-semibold text-[#2d2a26]"
                >
                  <option value="premio">Aquisição de Prêmios</option>
                  <option value="divulgacao">Divulgação / Gráfica</option>
                  <option value="taxa">Taxas Administrativas</option>
                  <option value="outro">Outras Despesas</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-black text-xs rounded-xl shadow-xs active:scale-95"
                >
                  Salvar Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-3 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-semibold text-xs rounded-xl active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
