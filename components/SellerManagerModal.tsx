'use client';

import React, { useState } from 'react';
import { Seller } from '@/types/raffle';
import { X, UserPlus, Trash2, Edit2, UserCheck } from 'lucide-react';
import { sounds } from '@/lib/sound';

interface SellerManagerModalProps {
  sellers: Seller[];
  onClose: () => void;
  onSaveSeller: (seller: Partial<Seller> & { name: string; phone: string }) => void;
  onDeleteSeller: (sellerId: string) => void;
}

export const SellerManagerModal: React.FC<SellerManagerModalProps> = ({
  sellers,
  onClose,
  onSaveSeller,
  onDeleteSeller,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [role, setRole] = useState<'seller' | 'admin'>('seller');
  const [targetNumbers, setTargetNumbers] = useState(20);

  const handleStartEdit = (seller: Seller) => {
    setEditingId(seller.id);
    setName(seller.name);
    setPhone(seller.phone);
    setEmail(seller.email || '');
    setPixKey(seller.pixKey || '');
    setRole(seller.role);
    setTargetNumbers(seller.targetNumbers || 20);
    setIsAdding(true);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setPhone('');
    setEmail('');
    setPixKey('');
    setRole('seller');
    setTargetNumbers(20);
    setIsAdding(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onSaveSeller({
      id: editingId || undefined,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      pixKey: pixKey.trim() || undefined,
      role,
      targetNumbers: Number(targetNumbers) || 20,
    });

    sounds.playSuccess();
    handleResetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26]">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#484832] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="w-5 h-5 text-[#fdfaf7] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-serif font-black text-sm sm:text-base text-white truncate">Equipe de Vendedores</h3>
              <p className="text-[11px] sm:text-xs text-[#e6dfd8] truncate">Controle de promotores e metas de venda</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white transition-colors active:scale-95 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Add / Edit Form */}
          {isAdding ? (
            <form onSubmit={handleSubmit} className="bg-[#f8f5f0] p-4 rounded-2xl border border-[#eee4db] space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#423d38]">
                {editingId ? 'Editar Vendedor' : 'Cadastrar Novo Vendedor'}
              </h4>

              <div>
                <label className="block text-xs font-bold text-[#423d38] mb-1">
                  Nome Completo <span className="text-[#D48166]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2.5 bg-white border border-[#eee4db] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#423d38] mb-1">
                    WhatsApp <span className="text-[#D48166]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(88) 99999-9999"
                    className="w-full px-3 py-2.5 bg-white border border-[#eee4db] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423d38] mb-1">
                    Meta de Cotas
                  </label>
                  <input
                    type="number"
                    value={targetNumbers}
                    onChange={(e) => setTargetNumbers(Number(e.target.value))}
                    min={1}
                    max={500}
                    className="w-full px-3 py-2.5 bg-white border border-[#eee4db] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#423d38] mb-1">
                    Perfil / Função
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'seller' | 'admin')}
                    className="w-full px-3 py-2.5 bg-white border border-[#eee4db] rounded-xl text-xs sm:text-sm font-semibold text-[#2d2a26]"
                  >
                    <option value="seller">Vendedor / Promotor</option>
                    <option value="admin">Coordenador Geral / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423d38] mb-1">
                    Chave PIX do Vendedor (Opcional)
                  </label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Chave pessoal"
                    className="w-full px-3 py-2.5 bg-white border border-[#eee4db] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Vendedor'}
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-3 bg-white hover:bg-[#eee4db] text-[#423d38] font-semibold text-xs rounded-xl border border-[#eee4db] active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-3 bg-[#fdf1eb] hover:bg-[#fae4da] text-[#D48166] border border-[#f0c3b4] rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Vendedor</span>
            </button>
          )}

          {/* List of Sellers */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#7c736a]">
              Vendedores Cadastrados ({sellers.length})
            </h4>

            {sellers.map((s) => (
              <div
                key={s.id}
                className="p-3.5 bg-[#f8f5f0] rounded-2xl border border-[#eee4db] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#5A5A40] text-white font-bold flex items-center justify-center shrink-0">
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2d2a26] truncate">{s.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          s.role === 'admin'
                            ? 'bg-[#e8f0e8] text-[#3d4b3d] border border-[#d1dec8]'
                            : 'bg-white text-[#7c736a] border border-[#eee4db]'
                        }`}
                      >
                        {s.role === 'admin' ? 'Coordenador' : 'Vendedor'}
                      </span>
                    </div>
                    <div className="text-xs text-[#7c736a] flex items-center gap-3 mt-0.5">
                      <span>📱 {s.phone}</span>
                      <span>🎯 Meta: {s.targetNumbers || 20} cotas</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(s)}
                    className="p-2 hover:bg-[#eee4db] text-[#5A5A40] rounded-lg transition-colors active:scale-95"
                    title="Editar vendedor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {sellers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remover vendedor "${s.name}"?`)) {
                          onDeleteSeller(s.id);
                        }
                      }}
                      className="p-2 hover:bg-[#fbe7df] text-[#b35c43] rounded-lg transition-colors active:scale-95"
                      title="Excluir vendedor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
