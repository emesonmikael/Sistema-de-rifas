'use client';

import React, { useState, useMemo } from 'react';
import { Raffle, Seller } from '@/types/raffle';
import { formatCurrency, generateWhatsAppLink } from '@/lib/pix';
import {
  FileText,
  Printer,
  Share2,
  Download,
  CheckCircle2,
  Users,
  DollarSign,
  Award,
  Calendar,
  Building,
  HeartHandshake,
  Search,
  Filter,
  Tag,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { sounds } from '@/lib/sound';

interface ReportsViewProps {
  raffle: Raffle;
  sellers: Seller[];
  onOpenEditRaffle?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  raffle,
  sellers,
  onOpenEditRaffle,
}) => {
  const [reportType, setReportType] = useState<
    'launch_note' | 'financial' | 'sellers' | 'full_table' | 'parish_statement'
  >('launch_note');

  // Search & Filter for buyers list
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'reserved' | 'available'>('all');

  const numbersList = useMemo(() => Object.values(raffle.numbers), [raffle.numbers]);
  const paidNumbers = useMemo(() => numbersList.filter((n) => n.status === 'paid'), [numbersList]);
  const reservedNumbers = useMemo(() => numbersList.filter((n) => n.status === 'reserved'), [numbersList]);
  const availableCount = raffle.totalNumbers - (paidNumbers.length + reservedNumbers.length);

  const totalCollected = useMemo(
    () =>
      paidNumbers.reduce(
        (acc, curr) => acc + (curr.amountPaid || raffle.pricePerNumber),
        0
      ),
    [paidNumbers, raffle.pricePerNumber]
  );

  const totalPending = reservedNumbers.length * raffle.pricePerNumber;
  const totalExpenses = useMemo(
    () => (raffle.expenses || []).reduce((acc, curr) => acc + curr.amount, 0),
    [raffle.expenses]
  );
  const netProfit = totalCollected - totalExpenses;
  const totalPrizeEstimatedValue = useMemo(
    () => (raffle.prizes || []).reduce((acc, p) => acc + (p.estimatedValue || 0), 0),
    [raffle.prizes]
  );

  // Filtered buyers list
  const filteredNumbers = useMemo(() => {
    return Array.from({ length: raffle.totalNumbers }, (_, i) => i + 1).filter((num) => {
      const item = raffle.numbers[num] || { number: num, status: 'available' };
      
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const numStr = num.toString().padStart(2, '0');
        const nameMatch = item.buyerName?.toLowerCase().includes(term);
        const phoneMatch = item.buyerPhone?.toLowerCase().includes(term);
        const sellerMatch = item.sellerName?.toLowerCase().includes(term);
        const numMatch = numStr.includes(term) || num.toString().includes(term);
        return nameMatch || phoneMatch || sellerMatch || numMatch;
      }

      return true;
    });
  }, [raffle.numbers, raffle.totalNumbers, statusFilter, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = 'Numero,Status,Comprador,Telefone,Vendedor,Metodo_Pagamento,Valor_Pago,Data_Pagamento\n';
    Array.from({ length: raffle.totalNumbers }, (_, i) => i + 1).forEach((num) => {
      const item = raffle.numbers[num] || { number: num, status: 'available' };
      const statusLabel = item.status === 'paid' ? 'PAGO' : item.status === 'reserved' ? 'RESERVADO' : 'DISPONIVEL';
      const row = [
        num.toString().padStart(2, '0'),
        statusLabel,
        `"${item.buyerName || ''}"`,
        `"${item.buyerPhone || ''}"`,
        `"${item.sellerName || ''}"`,
        `"${item.paymentMethod || ''}"`,
        item.status === 'paid' ? (item.amountPaid || raffle.pricePerNumber).toFixed(2) : '0.00',
        `"${item.paidAt ? new Date(item.paidAt).toLocaleDateString('pt-BR') : ''}"`,
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_compradores_${raffle.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.playSuccess();
  };

  const handleShareSummary = () => {
    const summary =
      `📊 *PRESTAÇÃO DE CONTAS - ${raffle.title}*\n` +
      `🏛️ *Entidade:* ${raffle.chapelOrOrgName}\n` +
      `📅 *Data de Emissão:* ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      `🎟️ *Cotas Totais:* ${raffle.totalNumbers}\n` +
      `✅ *Cotas Pagas:* ${paidNumbers.length} (${Math.round((paidNumbers.length / raffle.totalNumbers) * 100)}%)\n` +
      `⏳ *Cotas Reservadas:* ${reservedNumbers.length}\n` +
      `⚪ *Cotas Disponíveis:* ${availableCount}\n\n` +
      `💰 *Arrecadação Bruta:* ${formatCurrency(totalCollected)}\n` +
      `📉 *Despesas Registradas:* ${formatCurrency(totalExpenses)}\n` +
      `✨ *LUCRO LÍQUIDO REAL:* ${formatCurrency(netProfit)}\n\n` +
      `Documento oficial gerado pelo Sistema RifaPix.`;

    if (navigator.share) {
      navigator.share({
        title: `Prestação de Contas - ${raffle.title}`,
        text: summary,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(summary);
      sounds.playSuccess();
      alert('Resumo financeiro copiado para a área de transferência!');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Controls Header Banner - Hidden on print */}
      <div className="print:hidden bg-[#5A5A40] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-[#484832] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#484832] flex items-center justify-center font-bold text-white shadow-xs border border-white/20">
            <FileText className="w-8 h-8 text-[#fdfaf7]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold bg-[#484832] text-[#fdfaf7] px-2.5 py-0.5 rounded-full border border-white/20">
                Central de Relatórios & Nota Oficial
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white font-serif tracking-tight mt-1">
              Relatórios, Nota & Prestação de Contas
            </h2>
            <p className="text-xs text-[#e6dfd8]">
              Documentos oficiais, nota de lançamento, prêmios, balancete e auditoria de cotas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenEditRaffle && (
            <button
              onClick={onOpenEditRaffle}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#484832] hover:bg-[#3b3b28] text-[#fdfaf7] font-bold text-xs rounded-xl border border-white/20 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Editar Nota</span>
            </button>
          )}

          <button
            onClick={handleShareSummary}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#484832] hover:bg-[#3b3b28] text-[#fdfaf7] font-semibold text-xs rounded-xl border border-white/20 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D48166] hover:bg-[#c27055] text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Reports Tabs Selector - Hidden on print */}
      <div className="print:hidden flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#eee4db]">
        <button
          onClick={() => {
            setReportType('launch_note');
            sounds.playPop();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            reportType === 'launch_note'
              ? 'bg-[#5A5A40] text-white shadow-xs scale-102'
              : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-[#D48166]" />
          <span>1. Nota de Lançamento & Prêmios</span>
        </button>

        <button
          onClick={() => {
            setReportType('financial');
            sounds.playPop();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            reportType === 'financial'
              ? 'bg-[#5A5A40] text-white shadow-xs scale-102'
              : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>2. Balancete Financeiro</span>
        </button>

        <button
          onClick={() => {
            setReportType('sellers');
            sounds.playPop();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            reportType === 'sellers'
              ? 'bg-[#5A5A40] text-white shadow-xs scale-102'
              : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>3. Desempenho por Vendedor</span>
        </button>

        <button
          onClick={() => {
            setReportType('full_table');
            sounds.playPop();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            reportType === 'full_table'
              ? 'bg-[#5A5A40] text-white shadow-xs scale-102'
              : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>4. Lista de Compradores ({paidNumbers.length}/{raffle.totalNumbers})</span>
        </button>

        <button
          onClick={() => {
            setReportType('parish_statement');
            sounds.playPop();
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            reportType === 'parish_statement'
              ? 'bg-[#5A5A40] text-white shadow-xs scale-102'
              : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>5. Folha Oficial da Capela</span>
        </button>
      </div>

      {/* Printable Paper Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-10 border border-[#eee4db] shadow-md text-[#2d2a26] space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Formal Header */}
        <div className="border-b-2 border-[#eee4db] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#5A5A40] text-[#fdfaf7] flex items-center justify-center font-serif text-2xl font-black shrink-0">
              ✟
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]">
                {raffle.chapelOrOrgName}
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-serif text-[#2d2a26]">
                {raffle.title}
              </h1>
              <div className="text-xs text-[#7c736a]">
                Documento de Auditoria e Prestação de Contas Paroquial
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-[#7c736a] space-y-0.5" suppressHydrationWarning>
            <div>Data de Emissão: <strong suppressHydrationWarning>{new Date().toLocaleDateString('pt-BR')}</strong></div>
            <div>Horário: <strong suppressHydrationWarning>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></div>
            <div>Sorteio Previsto: <strong>{raffle.drawDate ? new Date(raffle.drawDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}</strong></div>
          </div>
        </div>

        {/* 1. NOTA DE LANÇAMENTO & DETALHES DOS PRÊMIOS */}
        {reportType === 'launch_note' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#eee4db] pb-2">
              <h3 className="font-serif font-black text-lg text-[#2d2a26] uppercase tracking-wide flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D48166]" />
                <span>Nota Oficial de Lançamento & Prêmios</span>
              </h3>
              <span className="text-xs font-bold text-[#5A5A40] bg-[#f0f4ee] px-3 py-1 rounded-lg border border-[#d1dec8]">
                {raffle.totalNumbers} Cotas de {formatCurrency(raffle.pricePerNumber)}
              </span>
            </div>

            {/* Purpose */}
            <div className="p-4 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#5A5A40]">
                <HeartHandshake className="w-4 h-4" />
                <span>Finalidade & Destinação dos Recursos</span>
              </div>
              <p className="text-sm font-semibold text-[#2d2a26] leading-relaxed">
                {raffle.causeDescription}
              </p>
            </div>

            {/* Prizes Grid */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#423d38]">
                Relação Oficial dos Prêmios a Serem Sorteados ({raffle.prizes.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {raffle.prizes.map((prize, idx) => (
                  <div
                    key={prize.order || idx}
                    className="p-4 bg-white rounded-2xl border-2 border-[#eee4db] shadow-xs space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-[#5A5A40] text-white text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        {prize.title || `${idx + 1}º PRÊMIO`}
                      </span>
                      {prize.estimatedValue && (
                        <span className="text-xs font-bold text-[#8c4b38] bg-[#fdf1eb] px-2 py-0.5 rounded border border-[#f3d2c8]">
                          Est.: {formatCurrency(prize.estimatedValue)}
                        </span>
                      )}
                    </div>

                    <h5 className="font-bold text-base text-[#2d2a26] font-serif leading-snug">
                      {prize.description}
                    </h5>

                    {prize.details && (
                      <p className="text-xs text-[#5a534c] bg-[#f8f5f0] p-2.5 rounded-xl border border-[#eee4db]">
                        {prize.details}
                      </p>
                    )}

                    {prize.donorName && (
                      <div className="text-[11px] text-[#5A5A40] font-semibold flex items-center gap-1 pt-1 border-t border-[#eee4db]">
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Doador/Parceiro: <strong>{prize.donorName}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Regulation */}
            <div className="p-4 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#423d38]">
                <FileText className="w-4 h-4 text-[#5A5A40]" />
                <span>Regulamento da Rifa</span>
              </div>
              <div className="text-xs text-[#5a534c] whitespace-pre-line leading-relaxed font-mono">
                {raffle.regulation ||
                  `1. O sorteio será realizado na data prevista com base nas cotas devidamente pagas.\n2. O contemplado será notificado via ligação ou mensagem oficial.\n3. O prêmio poderá ser retirado na sede da comunidade.`}
              </div>
            </div>

            {/* PIX & Draw info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-[#484832] text-white rounded-xl">
                <span className="text-[10px] uppercase font-bold text-[#dcd5cc] block">PIX Oficial da Rifa</span>
                <strong className="font-mono text-sm block mt-0.5 text-white">{raffle.pixKey}</strong>
                <span className="text-[11px] text-[#e6dfd8]">{raffle.pixReceiverName || 'Coordenação'}</span>
              </div>

              <div className="p-3.5 bg-[#f0f4ee] text-[#3d4b3d] rounded-xl border border-[#d1dec8]">
                <span className="text-[10px] uppercase font-bold text-[#556955] block">Auditoria do Sorteio</span>
                <strong className="text-sm block mt-0.5 text-[#2d2a26]">
                  {raffle.drawDate ? new Date(raffle.drawDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data a definir'} {raffle.drawTime ? `às ${raffle.drawTime}` : ''}
                </strong>
                <span className="text-[11px] text-[#556955]">{raffle.drawLocation || 'Capela'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. BALANCETE FINANCEIRO */}
        {reportType === 'financial' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-serif font-black text-lg text-[#2d2a26] uppercase tracking-wide border-b border-[#eee4db] pb-2">
              Demonstrativo de Receitas e Despesas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#f8f5f0] rounded-2xl border border-[#eee4db]">
                <div className="text-xs text-[#7c736a] font-bold uppercase">Arrecadação Bruta (Confirmada)</div>
                <div className="text-2xl font-mono font-black text-[#5A5A40] mt-1">
                  {formatCurrency(totalCollected)}
                </div>
                <div className="text-[11px] text-[#7c736a] mt-1">
                  {paidNumbers.length} cotas pagas ({formatCurrency(raffle.pricePerNumber)}/cada)
                </div>
              </div>

              <div className="p-4 bg-[#f8f5f0] rounded-2xl border border-[#eee4db]">
                <div className="text-xs text-[#7c736a] font-bold uppercase">Total de Despesas / Custos</div>
                <div className="text-2xl font-mono font-black text-[#b35c43] mt-1">
                  {formatCurrency(totalExpenses)}
                </div>
                <div className="text-[11px] text-[#7c736a] mt-1">
                  {raffle.expenses?.length || 0} lançamentos registrados
                </div>
              </div>

              <div className="p-4 bg-[#f0f4ee] rounded-2xl border border-[#d1dec8]">
                <div className="text-xs text-[#3d4b3d] font-bold uppercase">Saldo Líquido da Capela</div>
                <div className="text-2xl font-mono font-black text-[#3d4b3d] mt-1">
                  {formatCurrency(netProfit)}
                </div>
                <div className="text-[11px] text-[#3d4b3d] mt-1 font-semibold">
                  Recurso disponível para a paróquia
                </div>
              </div>
            </div>

            {/* Expenses Breakdown Table */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#423d38] mb-2">
                Detalhamento dos Custos Operacionais
              </h4>
              <table className="w-full text-xs text-left border border-[#eee4db] rounded-xl overflow-hidden">
                <thead className="bg-[#5A5A40] text-white">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Descrição da Despesa</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee4db]">
                  {(!raffle.expenses || raffle.expenses.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-3 text-center text-[#7c736a]">
                        Nenhuma despesa lançada nesta rifa.
                      </td>
                    </tr>
                  ) : (
                    raffle.expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="py-2 px-3 font-mono text-[#7c736a]">
                          {new Date(exp.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 font-bold text-[#2d2a26]">{exp.description}</td>
                        <td className="py-2 px-3 text-[#7c736a]">{exp.category}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#b35c43]">
                          -{formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. DESEMPENHO POR VENDEDOR */}
        {reportType === 'sellers' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-serif font-black text-lg text-[#2d2a26] uppercase tracking-wide border-b border-[#eee4db] pb-2">
              Balanço Individual por Vendedor Credenciado
            </h3>

            <div className="border border-[#eee4db] rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#5A5A40] text-white">
                  <tr>
                    <th className="py-3 px-3">Vendedor</th>
                    <th className="py-3 px-3">WhatsApp</th>
                    <th className="py-3 px-3 text-center">Cotas Pagas</th>
                    <th className="py-3 px-3 text-center">Reservadas</th>
                    <th className="py-3 px-3 text-right">Dinheiro em Mão</th>
                    <th className="py-3 px-3 text-right">Total Confirmado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee4db]">
                  {sellers.map((s) => {
                    const sellerSold = paidNumbers.filter((n) => n.sellerId === s.id);
                    const sellerReserved = reservedNumbers.filter((n) => n.sellerId === s.id);
                    const cash = sellerSold
                      .filter((n) => n.paymentMethod === 'DINHEIRO')
                      .reduce((acc, curr) => acc + (curr.amountPaid || raffle.pricePerNumber), 0);
                    const total = sellerSold.length * raffle.pricePerNumber;

                    return (
                      <tr key={s.id} className="hover:bg-[#fdfaf7]">
                        <td className="py-3 px-3 font-bold text-[#2d2a26]">
                          {s.name} {s.role === 'admin' ? '⭐ (Coord.)' : ''}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#7c736a]">{s.phone}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#5A5A40]">
                          {sellerSold.length}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[#D48166]">
                          {sellerReserved.length}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#D48166]">
                          {formatCurrency(cash)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-[#5A5A40]">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. LISTA COMPLETA DE COMPRADORES */}
        {reportType === 'full_table' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eee4db] pb-3">
              <h3 className="font-serif font-black text-lg text-[#2d2a26] uppercase tracking-wide">
                Relação de Cotas e Compradores ({filteredNumbers.length} listados)
              </h3>

              <button
                onClick={handleExportCSV}
                className="print:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV / Excel</span>
              </button>
            </div>

            {/* Filter & Search Bar - print:hidden */}
            <div className="print:hidden flex flex-col sm:flex-row items-center gap-3 bg-[#f8f5f0] p-3 rounded-2xl border border-[#eee4db]">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#7c736a] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por comprador, cota ou telefone..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#eee4db] rounded-xl text-[#2d2a26] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-[#7c736a]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-white border border-[#eee4db] rounded-xl font-bold text-[#423d38] focus:outline-none"
                >
                  <option value="all">Todas as Cotas ({raffle.totalNumbers})</option>
                  <option value="paid">Apenas Pagas ({paidNumbers.length})</option>
                  <option value="reserved">Apenas Reservadas ({reservedNumbers.length})</option>
                  <option value="available">Apenas Livres ({availableCount})</option>
                </select>
              </div>
            </div>

            <div className="border border-[#eee4db] rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#5A5A40] text-white">
                  <tr>
                    <th className="py-2.5 px-3 font-mono">Cota</th>
                    <th className="py-2.5 px-3">Nome do Comprador</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                    <th className="py-2.5 px-3">Vendedor</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee4db]">
                  {filteredNumbers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[#7c736a]">
                        Nenhuma cota encontrada com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredNumbers.map((num) => {
                      const item = raffle.numbers[num] || { number: num, status: 'available' };
                      const isPaid = item.status === 'paid';
                      const isReserved = item.status === 'reserved';

                      return (
                        <tr
                          key={num}
                          className={
                            isPaid
                              ? 'bg-white'
                              : isReserved
                              ? 'bg-[#fdf1eb]/50'
                              : 'bg-[#f8f5f0]/50 text-[#a89d91]'
                          }
                        >
                          <td className="py-2.5 px-3 font-mono font-black text-[#2d2a26]">
                            {num.toString().padStart(2, '0')}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#2d2a26]">
                            {item.buyerName || (item.status === 'available' ? '— (Disponível)' : 'Sem nome')}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#7c736a]">{item.buyerPhone || '—'}</td>
                          <td className="py-2.5 px-3 text-[#7c736a]">{item.sellerName || '—'}</td>
                          <td className="py-2.5 px-3">
                            {isPaid ? (
                              <span className="text-[#5A5A40] font-bold">✓ PAGO</span>
                            ) : isReserved ? (
                              <span className="text-[#D48166] font-bold">⏳ RESERVA</span>
                            ) : (
                              <span>LIVRE</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#423d38]">
                            {item.status !== 'available' ? formatCurrency(raffle.pricePerNumber) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. FOLHA OFICIAL DA CAPELA */}
        {reportType === 'parish_statement' && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-serif font-black text-lg text-[#2d2a26] uppercase tracking-wide border-b border-[#eee4db] pb-2">
              Ata de Prestação de Contas à Comunidade
            </h3>

            <div className="p-5 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] text-xs leading-relaxed space-y-3">
              <p>
                Aos cuidados da comunidade e coordenação da <strong>{raffle.chapelOrOrgName}</strong>, declaramos para os devidos fins a realização da <strong>{raffle.title}</strong>, com objetivo: <em>&ldquo;{raffle.causeDescription}&rdquo;</em>.
              </p>
              <p>
                Foram disponibilizadas ao todo <strong>{raffle.totalNumbers} cotas</strong> ao valor unitário de <strong>{formatCurrency(raffle.pricePerNumber)}</strong>. 
                Até a presente data, foram contabilizadas <strong>{paidNumbers.length} cotas quitadas</strong>, gerando uma arrecadação bruta de <strong>{formatCurrency(totalCollected)}</strong>.
              </p>
              <p>
                Com a dedução das despesas operacionais no montante de <strong>{formatCurrency(totalExpenses)}</strong>, apurou-se o resultado líquido final de <strong>{formatCurrency(netProfit)}</strong> destinado integralmente às obras e melhorias da Capela.
              </p>
            </div>

            {/* Signature Blocks */}
            <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs text-[#423d38]">
              <div className="border-t border-[#2d2a26] pt-2">
                <div className="font-bold text-[#2d2a26]">Coordenação Geral da Capela</div>
                <div className="text-[11px] text-[#7c736a]">{raffle.chapelOrOrgName}</div>
              </div>

              <div className="border-t border-[#2d2a26] pt-2">
                <div className="font-bold text-[#2d2a26]">Tesouraria / Comissão de Festas</div>
                <div className="text-[11px] text-[#7c736a]">Responsável Financeiro</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
