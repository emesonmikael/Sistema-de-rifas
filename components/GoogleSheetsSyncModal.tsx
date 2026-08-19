'use client';

import React, { useState, useEffect } from 'react';
import { Raffle } from '@/types/raffle';
import {
  getSheetsConfig,
  saveSheetsConfig,
  syncRaffleToGoogleSheets,
  generateGoogleAppsScriptCode,
  GoogleSheetsConfig,
} from '@/lib/sheetsSync';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { sounds } from '@/lib/sound';

interface GoogleSheetsSyncModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: (msg: string) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  raffle,
  isOpen,
  onClose,
  onSyncSuccess,
}) => {
  const [config, setConfig] = useState<GoogleSheetsConfig>(() => getSheetsConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'tutorial' | 'code'>('config');
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'idle';
    text: string;
  }>({ type: 'idle', text: '' });

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveSheetsConfig(config);
    sounds.playPop();
    setStatusFeedback({
      type: 'success',
      text: 'Configurações do Google Sheets salvas com sucesso!',
    });
    setTimeout(() => setStatusFeedback({ type: 'idle', text: '' }), 3000);
  };

  const handleSyncNow = async () => {
    if (!config.webhookUrl) {
      setStatusFeedback({
        type: 'error',
        text: 'Insira a URL do Webhook do Google Apps Script antes de sincronizar.',
      });
      return;
    }

    setIsSyncing(true);
    sounds.playPop();
    saveSheetsConfig(config);

    const result = await syncRaffleToGoogleSheets(raffle, 'FULL_SYNC', config.webhookUrl);
    setIsSyncing(false);

    if (result.success) {
      sounds.playSuccess();
      setConfig(getSheetsConfig());
      setStatusFeedback({
        type: 'success',
        text: `Sincronização concluída! ${result.rowsCount || raffle.totalNumbers} cotas salvas na planilha.`,
      });
      if (onSyncSuccess) {
        onSyncSuccess(result.message);
      }
    } else {
      setStatusFeedback({
        type: 'error',
        text: result.message,
      });
    }
  };

  const handleCopyCode = () => {
    const code = generateGoogleAppsScriptCode();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    sounds.playPop();
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#eee4db] overflow-hidden text-[#2d2a26]">
        {/* Modal Top Header */}
        <div className="bg-[#1e7e34] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#155724] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#155724] flex items-center justify-center text-white font-bold border border-white/20 shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-base sm:text-lg text-white truncate">
                  Integração com Google Planilhas (Sheets)
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-[#155724] text-[10px] uppercase tracking-wider font-extrabold rounded-full border border-white/20">
                  Nuvem Gratuita
                </span>
              </div>
              <p className="text-xs text-white/80 truncate">
                Salve e sincronize todos os bilhetes, compras e vendas no seu Google Drive
              </p>
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

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#eee4db] bg-[#f8f5f0] px-4 pt-2 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-[#1e7e34] text-[#1e7e34] bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-[#7c736a] hover:text-[#2d2a26]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Sincronização & URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tutorial'
                ? 'border-[#1e7e34] text-[#1e7e34] bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-[#7c736a] hover:text-[#2d2a26]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Passo a Passo (Como Fazer)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-[#1e7e34] text-[#1e7e34] bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-[#7c736a] hover:text-[#2d2a26]'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Código Apps Script</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {statusFeedback.text && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-slide-up ${
                statusFeedback.type === 'success'
                  ? 'bg-[#e8f5e9] text-[#1e7e34] border border-[#c8e6c9]'
                  : 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
              }`}
            >
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <X className="w-4 h-4 shrink-0" />
              )}
              <span>{statusFeedback.text}</span>
            </div>
          )}

          {/* TAB 1: Config & Instant Sync */}
          {activeTab === 'config' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#f0f9f1] border border-[#c8e6c9] rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1e7e34]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Como funciona a Planilha na Vercel:</span>
                </div>
                <p className="text-xs text-[#2d2a26] leading-relaxed">
                  Cada vez que um bilhete for reservado ou marcado como pago, o sistema pode enviar
                  instantaneamente uma linha atualizada para sua planilha do Google Sheets. Você e sua equipe
                  podem abrir no celular a qualquer hora!
                </p>
              </div>

              {/* Webhook Input Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#423d38] uppercase tracking-wider">
                  URL do Webhook do Google Apps Script <span className="text-[#D48166]">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value.trim() })}
                  className="w-full px-3.5 py-3 bg-[#f8f5f0] border border-[#eee4db] rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:ring-2 focus:ring-[#1e7e34] focus:outline-none text-[#2d2a26]"
                />
                <span className="text-[11px] text-[#7c736a] block">
                  Cole aqui a URL que o Google Sheets gerou em &quot;Implantar como Aplicativo da Web&quot;.
                </span>
              </div>

              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#f8f5f0] rounded-2xl border border-[#eee4db]">
                <div>
                  <span className="text-xs font-bold text-[#2d2a26] block">
                    Sincronização Automática em Tempo Real
                  </span>
                  <span className="text-[11px] text-[#7c736a]">
                    Envia atualizações para o Sheets a cada nova venda ou confirmação
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={config.autoSync}
                  onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                  className="w-5 h-5 text-[#1e7e34] rounded focus:ring-[#1e7e34] cursor-pointer"
                />
              </div>

              {/* Last Sync Info */}
              {config.lastSyncAt && (
                <div className="text-xs text-[#7c736a] flex items-center justify-between px-1">
                  <span>Última sincronização com a planilha:</span>
                  <span className="font-mono font-bold text-[#2d2a26]">
                    {new Date(config.lastSyncAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Main Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex-1 py-3.5 bg-[#1e7e34] hover:bg-[#155724] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Enviando para a Planilha...' : 'Sincronizar Tudo com o Sheets Agora'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-5 py-3.5 bg-[#f8f5f0] hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] active:scale-95"
                >
                  Salvar Configuração
                </button>
              </div>

              {/* Shortcut to tutorial if empty */}
              {!config.webhookUrl && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tutorial')}
                    className="text-xs font-bold text-[#1e7e34] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Não sabe como pegar essa URL? Veja o tutorial simples em 3 passos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Step by Step Tutorial */}
          {activeTab === 'tutorial' && (
            <div className="space-y-4 animate-fade-in text-xs sm:text-sm leading-relaxed text-[#2d2a26]">
              <div className="border border-[#eee4db] rounded-2xl p-4 bg-[#fdfaf7] space-y-3">
                <div className="flex items-center gap-2 font-bold text-[#1e7e34] font-serif text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#1e7e34] text-white text-xs flex items-center justify-center">1</span>
                  <span>Crie uma nova planilha no seu Google Drive</span>
                </div>
                <p className="text-xs text-[#7c736a] pl-8">
                  Acesse <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-[#1e7e34] underline font-bold inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3" /></a> e dê um nome à sua planilha (ex: <em>&quot;Rifa Paróquia 2026&quot;</em>).
                </p>
              </div>

              <div className="border border-[#eee4db] rounded-2xl p-4 bg-[#fdfaf7] space-y-3">
                <div className="flex items-center gap-2 font-bold text-[#1e7e34] font-serif text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#1e7e34] text-white text-xs flex items-center justify-center">2</span>
                  <span>Abra o Apps Script e Cole o Código</span>
                </div>
                <p className="text-xs text-[#7c736a] pl-8">
                  No menu superior do Google Sheets, clique em: <strong className="text-[#2d2a26]">Extensões &gt; Apps Script</strong>.
                  Apague o que estiver lá e cole o código da aba <strong>&quot;Código Apps Script&quot;</strong>.
                </p>
                <div className="pl-8 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className="px-3.5 py-2 bg-[#1e7e34] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Ver e Copiar Código Pronto</span>
                  </button>
                </div>
              </div>

              <div className="border border-[#eee4db] rounded-2xl p-4 bg-[#fdfaf7] space-y-3">
                <div className="flex items-center gap-2 font-bold text-[#1e7e34] font-serif text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#1e7e34] text-white text-xs flex items-center justify-center">3</span>
                  <span>Implantar como Web App e Gerar a URL</span>
                </div>
                <ol className="list-decimal pl-12 text-xs text-[#7c736a] space-y-1.5">
                  <li>No canto superior direito da tela do Apps Script, clique no botão azul <strong>Implantar (Deploy) &gt; Nova implantação</strong>.</li>
                  <li>Selecione o tipo de engrenagem ⚙️: <strong>Aplicativo da Web (Web App)</strong>.</li>
                  <li>Em <em>&quot;Quem pode acessar&quot;</em>, escolha: <strong className="text-[#2d2a26]">Qualquer pessoa (Anyone)</strong>.</li>
                  <li>Clique em <strong>Implantar</strong>, autorize o acesso com sua conta Google e copie a <strong>URL do aplicativo da Web</strong> gerada.</li>
                  <li>Cole essa URL na aba <strong>&quot;Sincronização &amp; URL&quot;</strong> aqui do sistema de rifas.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Code View & Copy */}
          {activeTab === 'code' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#7c736a] font-medium">
                  Código completo para colar no Google Apps Script:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-[#1e7e34] hover:bg-[#155724] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <pre className="p-4 bg-[#2d2a26] text-[#e6dfd8] rounded-2xl text-xs font-mono overflow-x-auto max-h-72 border border-[#3d3833] selection:bg-[#1e7e34]">
                {generateGoogleAppsScriptCode()}
              </pre>

              <p className="text-[11px] text-[#7c736a]">
                💡 Esse código cria automaticamente a aba <strong>&quot;Bilhetes&quot;</strong> formatada com cores e a aba <strong>&quot;Resumo Geral&quot;</strong> com métricas em tempo real.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f8f5f0] border-t border-[#eee4db] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#7c736a] truncate">
            {raffle.title} • {raffle.totalNumbers} Cotas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#eee4db] text-[#423d38] font-bold text-xs rounded-xl border border-[#eee4db] active:scale-95"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
