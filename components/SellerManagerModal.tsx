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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26]">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-5 flex items-center justify-between border-b border-[#484832]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#fdfaf7]" />
            <div>
              <h3 className="font-serif font-black text-base text-white">Equipe de Vendedores & Promotores</h3>
              <p className="text-xs text-[#e6dfd8]">Gerencie quem tem autorização para vender e receber</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Add / Edit Form */}
          {isAdding ? (
            <form onSubmit={handleSubmit} className="bg-[#f8f5f0] p-4 rounded-2xl border border-[#eee4db] space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#423d38]">
                {editingId ? 'Editar Vendedor' : 'Cadastrar Novo Vendedor'}
              </h4>

              <div>
                <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva (Pastoral da Juventude)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#eee4db] rounded-xl font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="tel"
                    placeholder="(88) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#eee4db] rounded-xl font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">Meta de Cotas</label>
                  <input
                    type="number"
                    min="1"
                    value={targetNumbers}
                    onChange={(e) => setTargetNumbers(parseInt(e.target.value) || 20)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#eee4db] rounded-xl font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">Função</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'seller' | 'admin')}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#eee4db] rounded-xl font-medium text-[#2d2a26]"
                  >
                    <option value="seller">Vendedor / Promotor</option>
                    <option value="admin">Coordenador / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423d38] uppercase mb-1">Chave PIX (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Chave para repasses"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#eee4db] rounded-xl font-medium focus:ring-2 focus:ring-[#5A5A40] focus:outline-none text-[#2d2a26]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Vendedor'}
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-semibold text-xs rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#484832] text-white font-bold text-xs rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-[#fdfaf7]" />
              <span>Cadastrar Novo Vendedor na Equipe</span>
            </button>
          )}

          {/* Existing Sellers List */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#7c736a]">
              Vendedores Cadastrados ({sellers.length})
            </h4>

            <div className="divide-y divide-[#eee4db] border border-[#eee4db] rounded-2xl overflow-hidden">
              {sellers.map((s) => (
                <div key={s.id} className="p-3.5 bg-white hover:bg-[#fdfaf7] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#5A5A40] text-white font-black flex items-center justify-center text-xs shadow-xs">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-[#2d2a26] flex items-center gap-1.5">
                        <span>{s.name}</span>
                        {s.role === 'admin' && (
                          <span className="text-[10px] bg-[#f0f4ee] text-[#3d4b3d] font-bold px-1.5 py-0.2 rounded border border-[#d1dec8]">
                            Coord.
                          </span>
                        )}
                      </div>
                      <div className="text-[#7c736a] font-mono text-[11px]">{s.phone} • Meta: {s.targetNumbers || 20} cotas</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(s)}
                      className="p-1.5 text-[#423d38] hover:text-[#2d2a26] hover:bg-[#f8f5f0] rounded-lg transition-colors"
                      title="Editar vendedor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {sellers.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Remover vendedor ${s.name}?`)) {
                            onDeleteSeller(s.id);
                          }
                        }}
                        className="p-1.5 text-[#a89d91] hover:text-[#b35c43] hover:bg-[#fdf1eb] rounded-lg transition-colors"
                        title="Remover vendedor"
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
    </div>
  );
};
