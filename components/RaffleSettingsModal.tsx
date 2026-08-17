'use client';

import React, { useState } from 'react';
import { Raffle, Prize } from '@/types/raffle';
import { formatCurrency } from '@/lib/pix';
import {
  X,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  Award,
  DollarSign,
  Calendar,
  Building,
  HeartHandshake,
  FileText,
  HelpCircle,
  Clock,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { sounds } from '@/lib/sound';

interface RaffleSettingsModalProps {
  raffle?: Raffle | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (data: Partial<Raffle> & { title: string; pricePerNumber: number; totalNumbers: number; pixKey: string }) => void;
}

export const RaffleSettingsModal: React.FC<RaffleSettingsModalProps> = ({
  raffle,
  isNew = false,
  onClose,
  onSave,
}) => {
  const [tab, setTab] = useState<'info' | 'prizes' | 'pricing' | 'pix_draw'>('info');

  // Form states
  const [title, setTitle] = useState(raffle?.title || (isNew ? 'NOVA RIFA BENEFICENTE' : 'RIFA BENEFICENTE'));
  const [category, setCategory] = useState(raffle?.category || 'Ação Beneficente Paroquial');
  const [causeDescription, setCauseDescription] = useState(
    raffle?.causeDescription ||
      'Em prol da aquisição de equipamentos e melhorias para a capela e projetos comunitários.'
  );
  const [chapelOrOrgName, setChapelOrOrgName] = useState(
    raffle?.chapelOrOrgName || 'Capela de São José Operário da Vaca Morta'
  );
  const [location, setLocation] = useState(raffle?.location || 'Comunidade Vaca Morta');
  const [pricePerNumber, setPricePerNumber] = useState(raffle?.pricePerNumber || 10);
  const [totalNumbers, setTotalNumbers] = useState(raffle?.totalNumbers || 50);
  const [customTotalInput, setCustomTotalInput] = useState(false);
  const [pixKey, setPixKey] = useState(raffle?.pixKey || 'franciscoalves258@gmail.com');
  const [pixKeyType, setPixKeyType] = useState<Raffle['pixKeyType']>(raffle?.pixKeyType || 'email');
  const [pixReceiverName, setPixReceiverName] = useState(
    raffle?.pixReceiverName || 'Francisco Alves - Coordenação'
  );
  const [pixCity, setPixCity] = useState(raffle?.pixCity || 'Cidade');
  const [drawDate, setDrawDate] = useState(raffle?.drawDate || '2026-09-01');
  const [drawTime, setDrawTime] = useState(raffle?.drawTime || '19:30');
  const [drawLocation, setDrawLocation] = useState(
    raffle?.drawLocation || 'Transmissão Ao Vivo na Capela e Redes Sociais'
  );
  const [regulation, setRegulation] = useState(
    raffle?.regulation ||
      `1. O sorteio será realizado na data estipulada com base nas cotas pagas.\n2. O pagamento deve ser confirmado via PIX ou dinheiro com vendedor credenciado.\n3. O ganhador será notificado imediatamente por telefone/WhatsApp.\n4. O prêmio pode ser retirado na secretaria da comunidade.`
  );
  const [reservationTimeoutHours, setReservationTimeoutHours] = useState(
    raffle?.reservationTimeoutHours || 24
  );

  // Detailed Prizes
  const [prizes, setPrizes] = useState<Prize[]>(
    raffle?.prizes && raffle.prizes.length > 0
      ? raffle.prizes
      : [
          {
            order: 1,
            title: '1º PRÊMIO',
            description: 'Cafeteira Elétrica e Faqueiro Completo Inox',
            donorName: 'Doação de Devotos e Colaboradores',
            estimatedValue: 280,
            details: 'Cafeteira elétrica com jarra em inox + jogo de talheres 24 peças Tramontina.',
          },
          {
            order: 2,
            title: '2º PRÊMIO',
            description: 'Uma unha completa (manicure/pedicure) e Uma Pós-graduação EaD MEC 100% paga',
            donorName: 'Parceiro Studio & Instituto EaD',
            estimatedValue: 1200,
            details: 'Sessão completa de cuidados com unhas + bolsa 100% integral em pós EaD reconhecida pelo MEC.',
          },
        ]
  );

  const handleAddPrize = () => {
    const nextOrder = prizes.length + 1;
    setPrizes([
      ...prizes,
      {
        order: nextOrder,
        title: `${nextOrder}º PRÊMIO`,
        description: '',
        donorName: '',
        estimatedValue: undefined,
        details: '',
      },
    ]);
  };

  const handleRemovePrize = (idx: number) => {
    if (prizes.length <= 1) return;
    const updated = prizes
      .filter((_, i) => i !== idx)
      .map((p, i) => ({ ...p, order: i + 1, title: `${i + 1}º PRÊMIO` }));
    setPrizes(updated);
  };

  const handlePrizeFieldChange = <K extends keyof Prize>(
    idx: number,
    field: K,
    val: Prize[K]
  ) => {
    const updated = [...prizes];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    setPrizes(updated);
  };

  const calculatedTotalRevenue = (Number(pricePerNumber) || 0) * (Number(totalNumbers) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !pixKey.trim()) {
      alert('Por favor, preencha o Título da Rifa e a Chave PIX.');
      return;
    }

    const validPrizes = prizes
      .filter((p) => p.description.trim() !== '')
      .map((p, i) => ({
        ...p,
        order: i + 1,
        title: p.title || `${i + 1}º PRÊMIO`,
      }));

    if (validPrizes.length === 0) {
      alert('Por favor, insira a descrição de pelo menos 1 prêmio.');
      return;
    }

    sounds.playSuccess();
    onSave({
      title: title.trim(),
      category: category.trim(),
      causeDescription: causeDescription.trim(),
      chapelOrOrgName: chapelOrOrgName.trim(),
      location: location.trim(),
      pricePerNumber: Number(pricePerNumber) || 10,
      totalNumbers: Number(totalNumbers) || 50,
      pixKey: pixKey.trim(),
      pixKeyType,
      pixReceiverName: pixReceiverName.trim(),
      pixCity: pixCity.trim(),
      drawDate,
      drawTime,
      drawLocation: drawLocation.trim(),
      regulation: regulation.trim(),
      reservationTimeoutHours: Number(reservationTimeoutHours) || 24,
      prizes: validPrizes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26] flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#5A5A40] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#484832] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#484832] flex items-center justify-center font-bold text-white shadow-xs border border-white/20">
              <Sparkles className="w-6 h-6 text-[#fdfaf7]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-extrabold bg-[#484832] text-[#fdfaf7] px-2.5 py-0.5 rounded-full border border-white/20">
                  {isNew ? 'Lançador de Nota / Nova Rifa' : 'Edição da Nota Oficial'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight mt-0.5">
                {isNew ? 'Iniciar Nova Rifa com Detalhes' : 'Editar Dados & Prêmios da Rifa'}
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

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 bg-[#fdfaf7] border-b border-[#eee4db] overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setTab('info')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'info'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
            }`}
          >
            1. Dados da Rifa & Causa
          </button>

          <button
            type="button"
            onClick={() => setTab('prizes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'prizes'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-[#D48166]" />
            <span>2. Cadastro de Prêmios ({prizes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('pricing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'pricing'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
            }`}
          >
            3. Cotas & Arrecadação
          </button>

          <button
            type="button"
            onClick={() => setTab('pix_draw')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === 'pix_draw'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'bg-white text-[#7c736a] border border-[#eee4db] hover:bg-[#f8f5f0]'
            }`}
          >
            4. PIX & Sorteio
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-[#fdfaf7]">
          {/* TAB 1: GENERAL INFO & CAUSE */}
          {tab === 'info' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-5 rounded-2xl border border-[#eee4db] shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                    Título Principal da Rifa *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: RIFA PIX PARA SÃO JOSÉ OPERÁRIO"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-bold text-[#2d2a26] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                      Capela / Paróquia / Associação
                    </label>
                    <input
                      type="text"
                      value={chapelOrOrgName}
                      onChange={(e) => setChapelOrOrgName(e.target.value)}
                      placeholder="Ex: Capela de São José Operário da Vaca Morta"
                      className="w-full px-3.5 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                      Categoria / Tipo da Ação
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ex: Ação Beneficente Paroquial"
                      className="w-full px-3.5 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                    Causa / Finalidade da Arrecadação
                  </label>
                  <textarea
                    rows={3}
                    value={causeDescription}
                    onChange={(e) => setCauseDescription(e.target.value)}
                    placeholder="Ex: Em prol da aquisição de um aparelho celular para a comunicação e criação da rede social da capela..."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  />
                  <span className="text-[11px] text-[#7c736a] mt-1 block">
                    Este texto aparece com destaque no cartaz oficial e nos recibos digitais.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                    Regulamento & Regras Oficiais da Rifa
                  </label>
                  <textarea
                    rows={4}
                    value={regulation}
                    onChange={(e) => setRegulation(e.target.value)}
                    placeholder="Regras de sorteio, prazos, entrega dos prêmios..."
                    className="w-full px-3.5 py-2 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-mono text-[#2d2a26] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED PRIZES LIST */}
          {tab === 'prizes' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#2d2a26] font-serif uppercase">
                    Prêmios Oficiais da Rifa
                  </h3>
                  <p className="text-xs text-[#7c736a]">
                    Cadastre cada prêmio com título, descrição minuciosa, doador e valor estimado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddPrize}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Prêmio</span>
                </button>
              </div>

              <div className="space-y-4">
                {prizes.map((prize, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border-2 border-[#eee4db] shadow-xs relative space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#eee4db] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#D48166] text-white text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                          {prize.title || `${idx + 1}º PRÊMIO`}
                        </span>
                        <input
                          type="text"
                          value={prize.title}
                          onChange={(e) => handlePrizeFieldChange(idx, 'title', e.target.value)}
                          placeholder="Ex: 1º PRÊMIO"
                          className="text-xs font-bold text-[#423d38] bg-transparent border-b border-transparent focus:border-[#5A5A40] focus:outline-none w-28"
                        />
                      </div>

                      {prizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePrize(idx)}
                          className="flex items-center gap-1 text-xs text-[#a89d91] hover:text-[#b35c43] p-1 transition-colors"
                          title="Remover este prêmio"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#423d38] mb-1">
                        Descrição do Prêmio (Nome dos Itens) *
                      </label>
                      <input
                        type="text"
                        value={prize.description}
                        onChange={(e) => handlePrizeFieldChange(idx, 'description', e.target.value)}
                        placeholder="Ex: Cafeteira Elétrica e Faqueiro Completo 24 peças"
                        className="w-full px-3.5 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-bold text-[#2d2a26] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#7c736a] uppercase mb-1">
                          Doador / Patrocinador / Parceiro
                        </label>
                        <input
                          type="text"
                          value={prize.donorName || ''}
                          onChange={(e) => handlePrizeFieldChange(idx, 'donorName', e.target.value)}
                          placeholder="Ex: Doação da Família Silva / Comercial Ramos"
                          className="w-full px-3 py-1.5 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#7c736a] uppercase mb-1">
                          Valor Estimado no Mercado (R$)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={prize.estimatedValue || ''}
                          onChange={(e) =>
                            handlePrizeFieldChange(
                              idx,
                              'estimatedValue',
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          placeholder="Ex: 280"
                          className="w-full px-3 py-1.5 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-mono font-bold text-[#5A5A40] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#7c736a] uppercase mb-1">
                        Detalhes & Especificações Adicionais
                      </label>
                      <textarea
                        rows={2}
                        value={prize.details || ''}
                        onChange={(e) => handlePrizeFieldChange(idx, 'details', e.target.value)}
                        placeholder="Ex: Voltagem 220V, marca Mondial, modelo inox com garantia de 1 ano..."
                        className="w-full px-3 py-1.5 text-xs bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRICING & NUMBERS */}
          {tab === 'pricing' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-5 rounded-2xl border border-[#eee4db] shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                      Valor por Cota / Bilhete (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#7c736a]">R$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={pricePerNumber}
                        onChange={(e) => setPricePerNumber(parseFloat(e.target.value) || 10)}
                        className="w-full pl-10 pr-3.5 py-2 text-base bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-black text-[#5A5A40] focus:bg-white focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                      Quantidade Total de Cotas *
                    </label>
                    {isNew ? (
                      <div>
                        {!customTotalInput ? (
                          <div className="space-y-2">
                            <select
                              value={totalNumbers}
                              onChange={(e) => {
                                if (e.target.value === 'custom') {
                                  setCustomTotalInput(true);
                                } else {
                                  setTotalNumbers(parseInt(e.target.value) || 50);
                                }
                              }}
                              className="w-full px-3.5 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-bold text-[#2d2a26] focus:bg-white focus:outline-none"
                            >
                              <option value="10">10 cotas (01 a 10) - Teste Rápido</option>
                              <option value="25">25 cotas (01 a 25)</option>
                              <option value="50">50 cotas (01 a 50) - Padrão Cartaz</option>
                              <option value="100">100 cotas (00 a 99) - Centena</option>
                              <option value="200">200 cotas</option>
                              <option value="500">500 cotas</option>
                              <option value="1000">1.000 cotas (Milhar)</option>
                              <option value="custom">Outro número personalizado...</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="5"
                              max="10000"
                              value={totalNumbers}
                              onChange={(e) => setTotalNumbers(parseInt(e.target.value) || 50)}
                              className="w-full px-3 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-bold text-[#2d2a26]"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomTotalInput(false)}
                              className="px-3 py-2 bg-[#eee4db] text-xs font-bold rounded-xl"
                            >
                              Padrões
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-3.5 py-2.5 bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-bold text-[#2d2a26] text-sm">
                        {totalNumbers} cotas (Fixo na rifa ativa para garantir vendas existentes)
                      </div>
                    )}
                  </div>
                </div>

                {/* Revenue Estimation Highlight */}
                <div className="p-4 bg-[#f0f4ee] rounded-2xl border border-[#d1dec8] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3d4b3d]">
                      Meta Bruta de Arrecadação:
                    </span>
                    <p className="text-[11px] text-[#556955]">
                      {totalNumbers} cotas x {formatCurrency(pricePerNumber)}
                    </p>
                  </div>
                  <div className="text-2xl font-mono font-black text-[#5A5A40]">
                    {formatCurrency(calculatedTotalRevenue)}
                  </div>
                </div>

                {/* Reservation timeout */}
                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                    Prazo para Pagamento da Reserva (Horas)
                  </label>
                  <select
                    value={reservationTimeoutHours}
                    onChange={(e) => setReservationTimeoutHours(parseInt(e.target.value) || 24)}
                    className="w-full px-3.5 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26]"
                  >
                    <option value="12">12 horas (Rápido)</option>
                    <option value="24">24 horas (Recomendado)</option>
                    <option value="48">48 horas (2 dias)</option>
                    <option value="72">72 horas (3 dias)</option>
                  </select>
                  <span className="text-[11px] text-[#7c736a] mt-1 block">
                    Após esse prazo, a reserva pode ser liberada automaticamente com um clique no Financeiro.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PIX & DRAW DATE */}
          {tab === 'pix_draw' && (
            <div className="space-y-4 animate-fade-in">
              {/* PIX Configuration */}
              <div className="bg-[#484832] text-white p-5 rounded-2xl border border-[#5A5A40] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#fdfaf7] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#D48166]" />
                    <span>Dados Oficiais do PIX</span>
                  </h4>
                  <span className="text-[10px] text-[#dcd5cc]">Recebimento Direto</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#e6dfd8] mb-1">Chave PIX *</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="E-mail, CPF, Telefone ou Chave aleatória"
                      className="w-full px-3 py-2 text-sm bg-[#3b3b28] border border-[#5A5A40] rounded-xl font-mono text-[#fdfaf7] focus:ring-2 focus:ring-[#D48166] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#e6dfd8] mb-1">Tipo da Chave</label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as Raffle['pixKeyType'])}
                      className="w-full px-3 py-2 text-xs bg-[#3b3b28] border border-[#5A5A40] rounded-xl text-white font-medium focus:outline-none"
                    >
                      <option value="email">E-mail</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="telefone">Telefone</option>
                      <option value="aleatoria">Chave Aleatória</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#e6dfd8] mb-1">Nome do Titular da Conta</label>
                    <input
                      type="text"
                      value={pixReceiverName}
                      onChange={(e) => setPixReceiverName(e.target.value)}
                      placeholder="Ex: Francisco Alves - Capela São José"
                      className="w-full px-3 py-2 text-xs bg-[#3b3b28] border border-[#5A5A40] rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#e6dfd8] mb-1">Cidade da Conta</label>
                    <input
                      type="text"
                      value={pixCity}
                      onChange={(e) => setPixCity(e.target.value)}
                      placeholder="Ex: Cidade da Paróquia"
                      className="w-full px-3 py-2 text-xs bg-[#3b3b28] border border-[#5A5A40] rounded-xl text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Draw Date, Time and Place */}
              <div className="bg-white p-5 rounded-2xl border border-[#eee4db] shadow-xs space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#423d38] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5A5A40]" />
                  <span>Programação do Sorteio</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                      Data Prevista do Sorteio
                    </label>
                    <input
                      type="date"
                      value={drawDate}
                      onChange={(e) => setDrawDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                      Horário Previsto
                    </label>
                    <input
                      type="time"
                      value={drawTime}
                      onChange={(e) => setDrawTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">
                    Local / Transmissão do Sorteio
                  </label>
                  <input
                    type="text"
                    value={drawLocation}
                    onChange={(e) => setDrawLocation(e.target.value)}
                    placeholder="Ex: Transmissão Ao Vivo na Capela e no Instagram Oficial"
                    className="w-full px-3.5 py-2 text-sm bg-[#f8f5f0] border border-[#eee4db] rounded-xl font-medium text-[#2d2a26]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#eee4db] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#7c736a]">
              {tab !== 'info' && (
                <button
                  type="button"
                  onClick={() => {
                    if (tab === 'pix_draw') setTab('pricing');
                    else if (tab === 'pricing') setTab('prizes');
                    else if (tab === 'prizes') setTab('info');
                  }}
                  className="px-3 py-2 bg-[#f8f5f0] hover:bg-[#eee4db] rounded-xl font-semibold text-[#423d38]"
                >
                  ← Aba Anterior
                </button>
              )}

              {tab !== 'pix_draw' && (
                <button
                  type="button"
                  onClick={() => {
                    if (tab === 'info') setTab('prizes');
                    else if (tab === 'prizes') setTab('pricing');
                    else if (tab === 'pricing') setTab('pix_draw');
                  }}
                  className="px-3 py-2 bg-[#f0f4ee] hover:bg-[#dce7d8] text-[#3d4b3d] rounded-xl font-bold"
                >
                  Próxima Aba →
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#484832] text-white font-black text-xs rounded-xl shadow-md transition-transform active:scale-95"
              >
                {isNew ? 'Criar & Publicar Nota da Rifa' : 'Salvar Alterações na Rifa'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
