'use client';

import React, { useState, useMemo } from 'react';
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

  // Toggle pending numbers for bulk confirmation
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
    sounds.playSuccess();
    onBulkConfirmPayments(selectedPendingNums);
    setSelectedPendingNums([]);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseDesc.trim() || isNaN(amt) || amt <= 0) return;

    sounds.playSuccess();
    onAddExpense({
      description: expenseDesc.trim(),
      amount: amt,
      category: expenseCategory,
      date: new Date().toISOString().split('T')[0],
      registeredBy: 'Coordenação',
    });

    setExpenseDesc('');
    setExpenseAmount('');
    setShowExpenseModal(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-[#5A5A40] text-white rounded-3xl p-6 shadow-md border border-[#484832] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#484832] flex items-center justify-center font-bold text-white shadow-xs border border-white/20">
            <DollarSign className="w-8 h-8 text-[#fdfaf7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold bg-[#484832] text-[#fdfaf7] px-2.5 py-0.5 rounded-full border border-white/20">
                Auditoria & Gestão Financeira
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-tight mt-1">
              Controle Financeiro da Rifa
            </h2>
            <p className="text-xs text-[#e6dfd8]">{raffle.title} • {raffle.chapelOrOrgName}</p>
          </div>
        </div>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D48166] hover:bg-[#c27055] text-white font-black text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Despesa</span>
        </button>
      </div>

      {/* Main KPI Cards Grid in Natural Tones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Receita Confirmada (Paga) */}
        <div className="bg-[#5A5A40] text-white rounded-3xl p-5 border border-[#484832] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#e6dfd8] font-bold mb-1">
            <span>Receita Confirmada</span>
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatCurrency(totalConfirmedRevenue)}
          </div>
          <div className="text-xs text-[#e6dfd8] mt-2 font-medium">
            {paidNumbers.length} cotas pagas ({Math.round((paidNumbers.length / raffle.totalNumbers) * 100)}%)
          </div>
        </div>

        {/* KPI 2: A Confirmar (Reservas) */}
        <div className="bg-white rounded-3xl p-5 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#D48166] font-bold mb-1">
            <span>A Confirmar (Reservas)</span>
            <Clock className="w-4 h-4 text-[#D48166]" />
          </div>
          <div className="text-2xl font-black text-[#D48166] font-mono">
            {formatCurrency(totalPendingRevenue)}
          </div>
          <div className="text-xs text-[#7c736a] mt-2 font-medium">
            {reservedNumbers.length} cotas aguardando
          </div>
        </div>

        {/* KPI 3: Despesas Totais */}
        <div className="bg-white rounded-3xl p-5 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7c736a] font-bold mb-1">
            <span>Despesas & Prêmios</span>
            <Trash2 className="w-4 h-4 text-[#a89d91]" />
          </div>
          <div className="text-2xl font-black text-[#b35c43] font-mono">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-xs text-[#7c736a] mt-2 font-medium">
            {raffle.expenses?.length || 0} custos cadastrados
          </div>
        </div>

        {/* KPI 4: Lucro Líquido Real */}
        <div className="bg-[#2d2a26] text-white rounded-3xl p-5 border border-[#5A5A40] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#D48166] font-bold mb-1">
            <span>Lucro Líquido Real</span>
            <TrendingUp className="w-4 h-4 text-[#D48166]" />
          </div>
          <div className="text-2xl font-black text-[#D48166] font-mono">
            {formatCurrency(netProfit)}
          </div>
          <div className="text-[11px] text-[#a89d91] mt-2 font-medium">
            Arrecadado menos despesas
          </div>
        </div>

        {/* KPI 5: Meta Total */}
        <div className="bg-white rounded-3xl p-5 border border-[#eee4db] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7c736a] font-bold mb-1">
            <span>Meta Máxima (100%)</span>
            <Sparkles className="w-4 h-4 text-[#5A5A40]" />
          </div>
          <div className="text-2xl font-black text-[#2d2a26] font-mono">
            {formatCurrency(potentialTotalRevenue)}
          </div>
          <div className="text-xs text-[#7c736a] mt-2 font-medium">
            {availableCount} cotas restantes
          </div>
        </div>
      </div>

      {/* Payment Channels Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#eee4db] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#7c736a] font-semibold">⚡ Arrecadação via PIX</span>
            <div className="text-lg font-black text-[#5A5A40] font-mono mt-0.5">
              {formatCurrency(pixRevenue)}
            </div>
          </div>
          <span className="text-xs font-bold text-[#7c736a] bg-[#f8f5f0] px-2.5 py-1 rounded-lg">
            {paidNumbers.filter((n) => n.paymentMethod === 'PIX').length} bilhetes
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#eee4db] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#7c736a] font-semibold">💵 Arrecadação em Dinheiro</span>
            <div className="text-lg font-black text-[#D48166] font-mono mt-0.5">
              {formatCurrency(cashRevenue)}
            </div>
          </div>
          <span className="text-xs font-bold text-[#7c736a] bg-[#f8f5f0] px-2.5 py-1 rounded-lg">
            {paidNumbers.filter((n) => n.paymentMethod === 'DINHEIRO').length} bilhetes
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#eee4db] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#7c736a] font-semibold">💳 Cartão / Outros</span>
            <div className="text-lg font-black text-[#2d2a26] font-mono mt-0.5">
              {formatCurrency(cardRevenue)}
            </div>
          </div>
          <span className="text-xs font-bold text-[#7c736a] bg-[#f8f5f0] px-2.5 py-1 rounded-lg">
            {paidNumbers.filter((n) => n.paymentMethod === 'CARTAO').length} bilhetes
          </span>
        </div>
      </div>

      {/* Two Columns: Pending Approvals Queue & Expenses Register */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pending Payments Approval Queue */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#eee4db] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eee4db]">
            <div>
              <h3 className="font-bold text-[#2d2a26] text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D48166]" />
                <span>Fila de Confirmação de Pagamentos ({reservedNumbers.length})</span>
              </h3>
              <p className="text-xs text-[#7c736a]">
                Verifique os comprovantes e confirme os bilhetes reservados
              </p>
            </div>

            {reservedNumbers.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllPending}
                  className="px-2.5 py-1 text-xs font-semibold text-[#423d38] bg-[#f8f5f0] hover:bg-[#eee4db] rounded-lg transition-colors"
                >
                  {selectedPendingNums.length === reservedNumbers.length ? 'Desmarcar' : 'Marcar Todos'}
                </button>

                {selectedPendingNums.length > 0 && (
                  <button
                    onClick={handleBulkConfirm}
                    className="px-3 py-1 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
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
                              onClick={() => {
                                sounds.playSuccess();
                                onConfirmPayment(item.number);
                              }}
                              className="px-2.5 py-1 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold rounded-lg text-[11px] shadow-xs"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => onReleaseNumber(item.number)}
                              className="px-2 py-1 text-[#D48166] hover:bg-[#fdf1eb] rounded-lg text-[11px] font-semibold"
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
              💡 Reservas sem confirmação podem ser liberadas pelo coordenador.
            </span>
            <button
              onClick={onReleaseExpired}
              className="text-[#D48166] hover:underline font-semibold"
            >
              Liberar Reservas Expiradas
            </button>
          </div>
        </div>

        {/* Right Column: Expenses & Cost Ledger */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#eee4db] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#eee4db]">
            <div>
              <h3 className="font-bold text-[#2d2a26] text-base">Livro de Despesas & Custos</h3>
              <p className="text-xs text-[#7c736a]">Registro para apuração exata do lucro</p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="p-1.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] rounded-xl border border-[#eee4db] transition-colors"
              title="Adicionar custo"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Expenses List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {(!raffle.expenses || raffle.expenses.length === 0) ? (
              <div className="py-8 text-center text-[#7c736a] text-xs">
                Nenhuma despesa registrada. Todo o valor arrecadado é lucro líquido!
              </div>
            ) : (
              raffle.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <div className="font-bold text-[#2d2a26]">{exp.description}</div>
                    <div className="text-[11px] text-[#7c736a]">
                      {exp.category} • {new Date(exp.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-[#b35c43]">
                      -{formatCurrency(exp.amount)}
                    </div>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="text-[11px] text-[#a89d91] hover:text-[#b35c43] transition-colors mt-0.5"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#eee4db] text-[#2d2a26]">
            <h3 className="text-lg font-black text-[#2d2a26] font-serif uppercase mb-1">
              Registrar Nova Despesa
            </h3>
            <p className="text-xs text-[#7c736a] mb-4">
              Custos de aquisição de prêmios, taxas bancárias ou impressão
            </p>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">Descrição do Custo</label>
                <input
                  type="text"
                  placeholder="Ex: Compra da cafeteira elétrica"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-mono font-bold text-[#2d2a26] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">Categoria</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                  className="w-full px-3.5 py-2 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-[#2d2a26] font-medium"
                >
                  <option value="premio">Aquisição de Prêmios</option>
                  <option value="divulgacao">Gráfica / Impressão de Cartazes</option>
                  <option value="taxa">Taxas Bancárias / PIX</option>
                  <option value="outro">Outras Despesas Operacionais</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Salvar Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-semibold text-xs rounded-xl transition-colors"
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
