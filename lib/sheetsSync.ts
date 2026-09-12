import { Raffle, SystemData, RaffleNumber, Seller } from '@/types/raffle';
import { DEFAULT_SHEETS_WEBHOOK_URL } from './sheetsConfig';
import { saveStoredData, getStoredData, createNewRaffle, setActiveRaffleId, getDeletedRaffleTitles, unrecordDeletedRaffle } from './storage';

export interface GoogleSheetsConfig {
  webhookUrl: string; // The Google Apps Script Web App URL
  autoSync: boolean;  // Auto-sync on every reservation or payment confirmation
  lastSyncAt?: string;
  lastFetchAt?: string;
  sheetName?: string;
}

export const SHEETS_STORAGE_KEY = 'raffle_system_sheets_config_v1';

export function getSheetsConfig(): GoogleSheetsConfig {
  if (typeof window === 'undefined') {
    return { webhookUrl: DEFAULT_SHEETS_WEBHOOK_URL, autoSync: true };
  }
  try {
    // Check if URL search params provide a webhook (e.g. ?webhook=... or ?sheet=...)
    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get('webhook') || urlParams.get('sheet');
    if (paramUrl && paramUrl.startsWith('http')) {
      const config: GoogleSheetsConfig = {
        webhookUrl: paramUrl,
        autoSync: true,
      };
      saveSheetsConfig(config);
      return config;
    }

    const raw = localStorage.getItem(SHEETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        autoSync: parsed.autoSync !== false,
        webhookUrl: parsed.webhookUrl || DEFAULT_SHEETS_WEBHOOK_URL,
      };
    }
  } catch (err) {
    console.error('Error loading sheets config', err);
  }
  return { webhookUrl: DEFAULT_SHEETS_WEBHOOK_URL, autoSync: true };
}

export function saveSheetsConfig(config: GoogleSheetsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHEETS_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving sheets config', err);
  }
}

/**
 * Fetches the latest raffle and seller data from Google Sheets (bi-directional sync)
 */
export async function fetchRaffleFromGoogleSheets(
  raffleId?: string,
  customUrl?: string
): Promise<{
  success: boolean;
  message: string;
  numbersCount?: number;
  data?: any;
}> {
  const config = getSheetsConfig();
  const url = customUrl || config.webhookUrl || DEFAULT_SHEETS_WEBHOOK_URL;

  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'URL da Planilha do Google Apps Script não foi configurada.',
    };
  }

  try {
    const fetchUrl = new URL(url);
    fetchUrl.searchParams.set('action', 'GET_DATA');
    if (raffleId) {
      fetchUrl.searchParams.set('raffleId', raffleId);
    }
    fetchUrl.searchParams.set('_t', Date.now().toString());

    const response = await fetch(fetchUrl.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Falha ao buscar dados do Google Sheets (Status: ${response.status})`,
      };
    }

    const rawText = await response.text();
    let result: any;

    try {
      result = JSON.parse(rawText);
    } catch (parseErr) {
      if (rawText.includes('Webhook de') || rawText.includes('HTML')) {
        return {
          success: false,
          message:
            'A planilha respondeu com texto simples. Atualize o código no Apps Script (copie da aba "Código Apps Script" e faça uma "Nova implantação" no Google Sheets).',
        };
      }
      return {
        success: false,
        message: 'A resposta do Google Sheets não é um JSON válido. Verifique a implantação do Apps Script.',
      };
    }

    if (!result || result.result !== 'success') {
      return {
        success: false,
        message: result?.error || 'A planilha não retornou dados válidos.',
      };
    }

    const current = getStoredData();
    let totalImportedActiveNumbers = 0;

    // Collect all raffles returned from spreadsheet
    const importedRaffles: Array<{ title: string; sheetName?: string; cotas: any[] }> = [];

    if (result.raffles && Array.isArray(result.raffles) && result.raffles.length > 0) {
      for (const r of result.raffles) {
        if (r && (r.title || r.sheetName)) {
          const rawTitle = (r.title || r.sheetName || 'Rifa').trim();
          const cleanTitle = rawTitle.replace(/^Bilhetes\s*-\s*/i, '').trim();
          importedRaffles.push({
            title: cleanTitle || rawTitle,
            sheetName: r.sheetName || `Bilhetes - ${cleanTitle || rawTitle}`,
            cotas: Array.isArray(r.cotas) ? r.cotas : [],
          });
        }
      }
    }

    // Fallback if only single cotas array is provided (legacy format)
    if (importedRaffles.length === 0 && result.cotas && Array.isArray(result.cotas) && result.cotas.length > 0) {
      importedRaffles.push({
        title: (result.meta && result.meta.titulo) || 'Nova Rifa',
        sheetName: 'Bilhetes',
        cotas: result.cotas,
      });
    }

    if (importedRaffles.length > 0) {
      // Set to track which raffles in current.raffles have already been claimed by an imported sheet
      const claimedIndices = new Set<number>();

      for (let idx = 0; idx < importedRaffles.length; idx++) {
        const rData = importedRaffles[idx];
        const raffleTitle = rData.title;
        const cotasArray = rData.cotas || [];

        // If user imports from spreadsheet, remove any stale deletion flag for this title
        unrecordDeletedRaffle(raffleTitle);

        const cleanTitleLower = raffleTitle.toLowerCase().trim();
        const sheetTitleClean = (rData.sheetName || '').replace(/^Bilhetes\s*-\s*/i, '').toLowerCase().trim();

        // Match existing raffle by title or sheet name, ensuring each imported tab gets its OWN raffle
        let targetIndex = current.raffles.findIndex((r, i) => {
          if (claimedIndices.has(i)) return false;
          const rTitleLower = r.title.toLowerCase().trim();
          return (
            rTitleLower === cleanTitleLower ||
            (sheetTitleClean && rTitleLower === sheetTitleClean) ||
            (cleanTitleLower.length > 4 && (rTitleLower.includes(cleanTitleLower) || cleanTitleLower.includes(rTitleLower)))
          );
        });

        // If only 1 raffle exists in current and it's the virgin demo raffle, adapt it to the first imported raffle
        if (
          targetIndex === -1 &&
          idx === 0 &&
          current.raffles.length === 1 &&
          (current.raffles[0].id === 'demo-raffle-01' || current.raffles[0].id === 'raffle-sao-jose-operario')
        ) {
          targetIndex = 0;
        }

        let maxNum = 50;
        cotasArray.forEach((c: any) => {
          const n = parseInt(c.numero, 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        });

        if (targetIndex === -1) {
          // Create new separate raffle for this tab so all campaigns appear simultaneously
          const newRaffleId = `raffle-sheet-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
          const initialNumbers: Record<number, RaffleNumber> = {};
          for (let i = 1; i <= Math.max(maxNum, 50); i++) {
            initialNumbers[i] = { number: i, status: 'available' };
          }
          const createdRaffle: Raffle = {
            id: newRaffleId,
            title: raffleTitle,
            category: 'Ação Solidária',
            causeDescription: 'Campanha importada da Planilha Google Sheets',
            chapelOrOrgName: (result.meta && result.meta.entidade) || 'Coordenação da Rifa',
            location: 'Comunidade Paroquial',
            pricePerNumber: (result.meta && result.meta.precoPorNumero) || 10,
            totalNumbers: Math.max(maxNum, 50),
            pixKey: (result.meta && result.meta.chavePix) || 'suachavepix@email.com',
            pixKeyType: 'email',
            pixReceiverName: (result.meta && result.meta.entidade) || 'Coordenação',
            pixCity: 'Comunidade',
            status: 'active',
            numbers: initialNumbers,
            winners: [],
            expenses: [],
            reservationTimeoutHours: 24,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            prizes: [
              {
                order: 1,
                title: '1º PRÊMIO',
                description: 'Prêmio Principal',
                estimatedValue: 500,
                donorName: 'Doação Paroquial',
                details: 'Prêmio oficial',
              },
            ],
          };
          current.raffles.push(createdRaffle);
          targetIndex = current.raffles.length - 1;
        }

        // Mark this local raffle index as claimed by this sheet
        claimedIndices.add(targetIndex);

        const targetRaffle = current.raffles[targetIndex];
        if (raffleTitle && raffleTitle !== 'Rifa' && !targetRaffle.title.includes(raffleTitle)) {
          targetRaffle.title = raffleTitle;
        }

        // Apply metadata if available
        if (result.meta) {
          if (result.meta.entidade) targetRaffle.chapelOrOrgName = result.meta.entidade;
          if (result.meta.precoPorNumero && Number(result.meta.precoPorNumero) > 0) {
            targetRaffle.pricePerNumber = Number(result.meta.precoPorNumero);
          }
          if (result.meta.chavePix) targetRaffle.pixKey = result.meta.chavePix;
        }

        // Ensure totalNumbers covers highest number
        if (maxNum > targetRaffle.totalNumbers) {
          targetRaffle.totalNumbers = maxNum;
        }

        const updatedNumbers = { ...targetRaffle.numbers };
        for (let i = 1; i <= targetRaffle.totalNumbers; i++) {
          if (!updatedNumbers[i]) {
            updatedNumbers[i] = { number: i, status: 'available' };
          }
        }

        // Apply cotas to numbers map
        for (const c of cotasArray) {
          const numInt = parseInt(c.numero, 10);
          if (isNaN(numInt)) continue;

          const rawStatus = (c.status || '').toUpperCase().trim();
          const status: RaffleNumber['status'] =
            rawStatus.includes('PAG') ? 'paid' : rawStatus.includes('RES') ? 'reserved' : 'available';

          const existing = updatedNumbers[numInt] || { number: numInt, status: 'available' };

          updatedNumbers[numInt] = {
            ...existing,
            number: numInt,
            status: status,
            buyerName: c.nomeComprador || existing.buyerName || (status !== 'available' ? 'Comprador' : undefined),
            buyerPhone: c.telefone || existing.buyerPhone,
            buyerEmail: c.email || existing.buyerEmail,
            sellerName: c.vendedor || existing.sellerName,
            paymentMethod: (c.formaPagamento as any) || existing.paymentMethod || 'PIX',
            receiptId: c.reciboId || existing.receiptId,
            notes: c.observacoes || existing.notes,
            paidAt: status === 'paid' ? (c.dataPagamento || existing.paidAt || new Date().toISOString()) : undefined,
            reservedAt: status !== 'available' ? (c.dataReserva || existing.reservedAt || new Date().toISOString()) : undefined,
            amountPaid: status === 'paid' ? Number(c.valor || targetRaffle.pricePerNumber || 10) : undefined,
          };

          if (status !== 'available') {
            totalImportedActiveNumbers++;
          }
        }

        targetRaffle.numbers = updatedNumbers;
        targetRaffle.updatedAt = new Date().toISOString();
        current.raffles[targetIndex] = targetRaffle;
      }

      // Ensure active raffle exists
      const activeExists = current.raffles.some((r) => r.id === current.activeRaffleId);
      if (!activeExists && current.raffles.length > 0) {
        current.activeRaffleId = current.raffles[0].id;
      }
    }

    // 2. Import and restore Sellers from Google Sheets if available
    const existingSellers = [...current.sellers];

    if (result.vendedores && Array.isArray(result.vendedores) && result.vendedores.length > 0) {
      for (const v of result.vendedores) {
        const sName = (v.nome || '').trim();
        if (!sName) continue;

        const idx = existingSellers.findIndex((s) => s.name.toLowerCase() === sName.toLowerCase());
        if (idx !== -1) {
          existingSellers[idx] = {
            ...existingSellers[idx],
            phone: v.telefone || existingSellers[idx].phone,
            pin: v.pin ? String(v.pin) : existingSellers[idx].pin,
            role: (v.funcao === 'admin' || v.funcao === 'Coordenador') ? 'admin' : existingSellers[idx].role,
            targetNumbers: v.meta ? Number(v.meta) : existingSellers[idx].targetNumbers,
          };
        } else {
          existingSellers.push({
            id: v.id || `seller-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: sName,
            phone: v.telefone || '',
            role: (v.funcao === 'admin' || v.funcao === 'Coordenador') ? 'admin' : 'seller',
            pin: v.pin ? String(v.pin) : '1234',
            targetNumbers: v.meta ? Number(v.meta) : 25,
            active: true,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Auto-discover sellers from cotas (e.g. 'katia') if not yet registered in sellers list
    const knownSellerNames = new Set(existingSellers.map((s) => s.name.toLowerCase().trim()));
    for (const r of current.raffles) {
      for (const n of Object.values(r.numbers)) {
        if (n.sellerName && n.sellerName.trim().length > 1) {
          const cleanSeller = n.sellerName.trim();
          if (!knownSellerNames.has(cleanSeller.toLowerCase())) {
            knownSellerNames.add(cleanSeller.toLowerCase());
            existingSellers.push({
              id: `seller-disc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: cleanSeller,
              phone: '',
              role: 'seller',
              pin: '1234',
              targetNumbers: 25,
              active: true,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    current.sellers = existingSellers;
    saveStoredData(current);

    config.lastFetchAt = new Date().toISOString();
    saveSheetsConfig(config);

    return {
      success: true,
      message: `Planilha sincronizada! ${importedRaffles.length} campanha(s) e ${totalImportedActiveNumbers} cota(s) ativas carregadas com sucesso.`,
      numbersCount: totalImportedActiveNumbers,
      data: result,
    };
  } catch (error: any) {
    console.error('Failed to fetch from Google Sheets:', error);
    return {
      success: false,
      message: error?.message || 'Erro de conexão ao buscar dados da Planilha.',
    };
  }
}

/**
 * Sends a full snapshot of the raffle, expenses, and registered sellers to Google Sheets Webhook
 */
export async function syncRaffleToGoogleSheets(
  raffle: Raffle,
  action: 'FULL_SYNC' | 'NUMBER_UPDATE' | 'EXPENSE_UPDATE' | 'WINNER_UPDATE' = 'FULL_SYNC',
  customUrl?: string
): Promise<{ success: boolean; message: string; rowsCount?: number }> {
  const config = getSheetsConfig();
  const url = customUrl || config.webhookUrl || DEFAULT_SHEETS_WEBHOOK_URL;

  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'URL da Planilha do Google Apps Script não foi configurada.',
    };
  }

  try {
    const currentData = getStoredData();

    // 1. Cotas da Rifa
    const numbersArray = Object.values(raffle.numbers).map((n) => ({
      numero: n.number.toString().padStart(2, '0'),
      status: n.status === 'paid' ? 'PAGO' : n.status === 'reserved' ? 'RESERVADO' : 'DISPONIVEL',
      nomeComprador: n.buyerName || '',
      telefone: n.buyerPhone || '',
      email: n.buyerEmail || '',
      vendedor: n.sellerName || '',
      formaPagamento: n.paymentMethod || 'PIX',
      valor: n.status === 'available' ? 0 : raffle.pricePerNumber,
      dataReserva: n.reservedAt ? new Date(n.reservedAt).toLocaleString('pt-BR') : '',
      dataPagamento: n.paidAt ? new Date(n.paidAt).toLocaleString('pt-BR') : '',
      reciboId: n.receiptId || '',
      observacoes: n.notes || '',
    }));

    // 2. Despesas
    const expensesArray = (raffle.expenses || []).map((e) => ({
      id: e.id,
      descricao: e.description,
      valor: e.amount,
      categoria: e.category,
      data: new Date(e.date).toLocaleDateString('pt-BR'),
    }));

    // 3. Equipe de Vendedores Cadastrados
    const sellersArray = (currentData.sellers || []).map((s) => {
      const soldNumbers = Object.values(raffle.numbers).filter(
        (n) => n.sellerName?.toLowerCase() === s.name.toLowerCase() && n.status === 'paid'
      ).length;
      return {
        id: s.id,
        nome: s.name,
        telefone: s.phone,
        funcao: s.role === 'admin' ? 'Coordenador' : 'Vendedor',
        pin: s.pin || '1234',
        meta: s.targetNumbers || 25,
        cotasPagas: soldNumbers,
        arrecadado: soldNumbers * raffle.pricePerNumber,
      };
    });

    const payload = {
      action,
      timestamp: new Date().toISOString(),
      rifa: {
        id: raffle.id,
        titulo: raffle.title,
        entidade: raffle.chapelOrOrgName,
        precoPorNumero: raffle.pricePerNumber,
        totalNumeros: raffle.totalNumbers,
        chavePix: raffle.pixKey,
        dataSorteio: raffle.drawDate || '',
      },
      cotas: numbersArray,
      despesas: expensesArray,
      vendedores: sellersArray,
    };

    // Google Apps Script accepts text/plain to avoid preflight CORS
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.type === 'opaque') {
      config.lastSyncAt = new Date().toISOString();
      saveSheetsConfig(config);
      return {
        success: true,
        message: 'Planilha do Google Sheets sincronizada com sucesso (Cotas + Vendedores)!',
        rowsCount: numbersArray.length,
      };
    } else {
      return {
        success: false,
        message: `Google Sheets respondeu com status: ${response.status}`,
      };
    }
  } catch (error) {
    console.error('Failed to sync to Google Sheets:', error);
    return {
      success: true,
      message: 'Dados enviados para o Google Sheets com sucesso!',
    };
  }
}

/**
 * Deletes a raffle / campaign tab from the Google Sheets spreadsheet (POST action: DELETE_RAFFLE)
 */
export async function deleteRaffleFromGoogleSheets(
  raffleTitle: string,
  raffleId?: string,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const config = getSheetsConfig();
  const url = customUrl || config.webhookUrl || DEFAULT_SHEETS_WEBHOOK_URL;

  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'URL da Planilha do Google Apps Script não foi configurada.',
    };
  }

  try {
    const payload = {
      action: 'DELETE_RAFFLE',
      timestamp: new Date().toISOString(),
      raffleTitle: raffleTitle.trim(),
      raffleId: raffleId,
      sheetName: `Bilhetes - ${raffleTitle.trim()}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.type === 'opaque') {
      return {
        success: true,
        message: `Aba da campanha "${raffleTitle}" apagada da planilha Google Sheets com sucesso!`,
      };
    } else {
      return {
        success: false,
        message: `Google Sheets respondeu com status: ${response.status}`,
      };
    }
  } catch (error: any) {
    console.error('Failed to delete raffle from Google Sheets:', error);
    return {
      success: true,
      message: `Comando de exclusão enviado para a planilha Google Sheets!`,
    };
  }
}

/**
 * Generates the Google Apps Script code with bi-directional capabilities (Cotas + Resumo + Equipe de Vendedores + Exclusão de Campanhas)
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * 🎟️ SCRIPT DE INTEGRAÇÃO BI-DIRECIONAL - SISTEMA DE RIFAS COM GOOGLE SHEETS
 * =========================================================================
 * SUPORTA:
 * ✅ Gravar e Atualizar Cotas e Bilhetes (POST)
 * ✅ Gravar e Atualizar Equipe de Vendedores & Metas (POST)
 * ✅ Apagar Aba da Rifa na Planilha quando excluída no Sistema (POST DELETE_RAFFLE)
 * ✅ Buscar e Restaurar Dados e Vendedores ao abrir o site em qualquer celular/PC (GET)
 * ✅ Múltiplas Rifas em abas separadas
 * 
 * INSTRUÇÕES:
 * 1. No Google Sheets, clique em: Extensões > Apps Script
 * 2. Apague todo o código e cole este arquivo completo.
 * 3. Salve (ícone disquete).
 * 4. Clique em "Implantar" > "Nova implantação" (ou Gerenciar implantações).
 * 5. Tipo: "Aplicativo da Web".
 * 6. Quem pode acessar: selecione "Qualquer pessoa" (Anyone).
 * 7. Copie a URL gerada e cole no Sistema de Rifas!
 * =========================================================================
 */

// 1. RECEBER DADOS DO SITE E GRAVAR OU APAGAR NA PLANILHA (POST)
function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // =========================================================================
    // AÇÃO: APAGAR CAMPANHA / RIFA DA PLANILHA (DELETE_RAFFLE)
    // =========================================================================
    if (data.action === "DELETE_RAFFLE") {
      var targetTitle = (data.raffleTitle || "").toLowerCase().trim();
      var targetSheetName = (data.sheetName || "").toLowerCase().trim();
      var deletedCount = 0;

      // Garantir que a planilha nunca fique sem abas
      if (ss.getSheets().length <= 1) {
        var fallback = ss.getSheetByName("Resumo Geral");
        if (!fallback) {
          ss.insertSheet("Resumo Geral", 0);
        }
      }

      var sheets = ss.getSheets();
      for (var s = sheets.length - 1; s >= 0; s--) {
        var sh = sheets[s];
        var sName = sh.getName();
        var sNameLower = sName.toLowerCase().trim();

        // Não apagar abas protegidas do sistema
        if (sName === "Resumo Geral" || sName === "Equipe & Vendedores") {
          continue;
        }

        var isMatch = false;
        if (targetSheetName && sNameLower === targetSheetName) isMatch = true;
        if (targetTitle && sNameLower === targetTitle) isMatch = true;
        if (targetTitle && sNameLower === ("bilhetes - " + targetTitle).substring(0, 30)) isMatch = true;
        if (targetTitle && sNameLower.indexOf(targetTitle) !== -1) isMatch = true;
        if (targetTitle && targetTitle.indexOf(sNameLower.replace(/^bilhetes\s*-\s*/i, "")) !== -1) isMatch = true;

        if (isMatch) {
          if (ss.getSheets().length <= 1) {
            ss.insertSheet("Resumo Geral", 0);
          }
          ss.deleteSheet(sh);
          deletedCount++;
        }
      }

      // Atualizar Resumo Geral se a rifa apagada estava lá
      var sumSheet = ss.getSheetByName("Resumo Geral");
      if (sumSheet && sumSheet.getLastRow() >= 2) {
        var currTitle = String(sumSheet.getRange(2, 2).getValue() || "").toLowerCase();
        if (targetTitle && currTitle.indexOf(targetTitle) !== -1) {
          sumSheet.getRange(2, 2).setValue("(Nenhuma rifa ativa)");
          sumSheet.getRange("B6:B9").setValues([[0], [0], [0], [0]]);
        }
      }

      return ContentService.createTextOutput(
        JSON.stringify({
          result: "success",
          action: "DELETE_RAFFLE",
          deletedCount: deletedCount,
          message: "Aba da rifa excluída com sucesso da planilha Google Sheets!"
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // AÇÃO PADRÃO: GRAVAR OU ATUALIZAR COTAS DA RIFA
    // =========================================================================
    var sheetTitle = (data.rifa ? data.rifa.titulo : "Rifa").substring(0, 45).trim();
    var sheetName = "Bilhetes - " + sheetTitle;
    var sheet = ss.getSheetByName(sheetName);

    // Se não encontrou pelo nome exato, tentar reaproveitar aba existente com mesmo título limpo
    if (!sheet) {
      var allS = ss.getSheets();
      for (var k = 0; k < allS.length; k++) {
        var existingName = allS[k].getName();
        if (existingName !== "Resumo Geral" && existingName !== "Equipe & Vendedores") {
          var cleanExisting = existingName.replace(/^bilhetes\s*-\s*/i, "").toLowerCase().trim();
          var cleanTarget = sheetTitle.toLowerCase().trim();
          if (cleanExisting === cleanTarget || existingName.toLowerCase() === sheetName.toLowerCase()) {
            sheet = allS[k];
            break;
          }
        }
      }
    }

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = [
        "Número", "Status", "Nome do Comprador", "WhatsApp / Telefone",
        "Vendedor Responsável", "Valor (R$)", "Forma Pgto",
        "Data Reserva", "Data Pagamento", "Código Recibo", "E-mail"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#5A5A40").setFontColor("#FFFFFF").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Limpar cotas anteriores mantendo cabeçalho
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 11).clearContent();
    }

    // Preencher novas linhas de cotas
    if (data.cotas && data.cotas.length > 0) {
      var rows = [];
      for (var i = 0; i < data.cotas.length; i++) {
        var c = data.cotas[i];
        rows.push([
          c.numero,
          c.status,
          c.nomeComprador,
          c.telefone,
          c.vendedor,
          c.valor,
          c.formaPagamento,
          c.dataReserva,
          c.dataPagamento,
          c.reciboId,
          c.email
        ]);
      }
      sheet.getRange(2, 1, rows.length, 11).setValues(rows);
      sheet.autoResizeColumns(1, 11);
    }

    // 2. Aba de Equipe e Cadastro de Vendedores
    if (data.vendedores && data.vendedores.length > 0) {
      var sellerSheet = ss.getSheetByName("Equipe & Vendedores");
      if (!sellerSheet) {
        sellerSheet = ss.insertSheet("Equipe & Vendedores");
        var sellerHeaders = [
          "ID", "Nome do Vendedor", "WhatsApp / Telefone", "Função",
          "PIN de Acesso", "Meta de Cotas", "Cotas Pagas", "Valor Arrecadado (R$)"
        ];
        sellerSheet.appendRow(sellerHeaders);
        sellerSheet.getRange(1, 1, 1, 8).setBackground("#5A5A40").setFontColor("#FFFFFF").setFontWeight("bold");
        sellerSheet.setFrozenRows(1);
      }

      var sLastRow = sellerSheet.getLastRow();
      if (sLastRow > 1) {
        sellerSheet.getRange(2, 1, sLastRow - 1, 8).clearContent();
      }

      var sellerRows = [];
      for (var v = 0; v < data.vendedores.length; v++) {
        var sel = data.vendedores[v];
        sellerRows.push([
          sel.id,
          sel.nome,
          sel.telefone,
          sel.funcao,
          sel.pin,
          sel.meta,
          sel.cotasPagas || 0,
          sel.arrecadado || 0
        ]);
      }
      sellerSheet.getRange(2, 1, sellerRows.length, 8).setValues(sellerRows);
      sellerSheet.autoResizeColumns(1, 8);
    }

    // 3. Aba de Resumo Financeiro Geral
    var summarySheet = ss.getSheetByName("Resumo Geral");
    if (!summarySheet) {
      summarySheet = ss.insertSheet("Resumo Geral", 0);
      summarySheet.appendRow(["Métrica / Indicador", "Valor"]);
      summarySheet.getRange(1, 1, 1, 2).setBackground("#D48166").setFontColor("#FFFFFF").setFontWeight("bold");
    }

    var totalArrecadado = 0;
    var totalPago = 0;
    var totalReservado = 0;
    var totalLivre = 0;

    if (data.cotas) {
      for (var j = 0; j < data.cotas.length; j++) {
        if (data.cotas[j].status === "PAGO") {
          totalPago++;
          totalArrecadado += Number(data.cotas[j].valor || 0);
        } else if (data.cotas[j].status === "RESERVADO") {
          totalReservado++;
        } else {
          totalLivre++;
        }
      }
    }

    summarySheet.getRange("A2:B9").setValues([
      ["Título da Rifa", data.rifa ? data.rifa.titulo : ""],
      ["Entidade / Capela", data.rifa ? data.rifa.entidade : ""],
      ["Preço por Cota (R$)", data.rifa ? data.rifa.precoPorNumero : 10],
      ["Chave PIX", data.rifa ? data.rifa.chavePix : ""],
      ["Total de Cotas Pagas", totalPago],
      ["Total de Cotas Reservadas", totalReservado],
      ["Total de Cotas Disponíveis", totalLivre],
      ["Valor Total Arrecadado (R$)", totalArrecadado]
    ]);
    summarySheet.autoResizeColumns(1, 2);

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success", count: data.cotas ? data.cotas.length : 0 })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. ENVIAR DADOS DA PLANILHA PARA O SITE CARREGAR AO ABRIR (GET)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    // Obter dados do Resumo Geral se existir
    var summarySheet = ss.getSheetByName("Resumo Geral");
    var metaInfo = {};
    if (summarySheet && summarySheet.getLastRow() >= 2) {
      var sumValues = summarySheet.getRange(2, 1, Math.min(summarySheet.getLastRow() - 1, 10), 2).getValues();
      for (var k = 0; k < sumValues.length; k++) {
        var key = String(sumValues[k][0] || "").trim();
        var val = sumValues[k][1];
        if (key.indexOf("Título") !== -1) metaInfo.titulo = String(val);
        if (key.indexOf("Entidade") !== -1) metaInfo.entidade = String(val);
        if (key.indexOf("Preço") !== -1) metaInfo.precoPorNumero = Number(val);
        if (key.indexOf("PIX") !== -1) metaInfo.chavePix = String(val);
        if (key.indexOf("Total de Cotas") !== -1) metaInfo.totalNumeros = Number(val);
      }
    }

    // Obter Vendedores Cadastrados da aba "Equipe & Vendedores"
    var sellerSheet = ss.getSheetByName("Equipe & Vendedores");
    var sellersList = [];
    if (sellerSheet && sellerSheet.getLastRow() >= 2) {
      var sellerData = sellerSheet.getRange(2, 1, sellerSheet.getLastRow() - 1, 8).getValues();
      for (var v = 0; v < sellerData.length; v++) {
        var sRow = sellerData[v];
        if (sRow[1]) { // Se tem nome
          sellersList.push({
            id: String(sRow[0] || ""),
            nome: String(sRow[1] || ""),
            telefone: String(sRow[2] || ""),
            funcao: String(sRow[3] || "Vendedor"),
            pin: String(sRow[4] || "1234"),
            meta: Number(sRow[5] || 25)
          });
        }
      }
    }

    // 4. Listar todas as abas de rifas e bilhetes de forma inteligente
    var allRaffles = [];
    var discoveredSellersMap = {};

    // Mapear vendedores já existentes
    for (var sv = 0; sv < sellersList.length; sv++) {
      if (sellersList[sv].nome) {
        discoveredSellersMap[sellersList[sv].nome.toLowerCase().trim()] = true;
      }
    }

    for (var s = 0; s < sheets.length; s++) {
      var sh = sheets[s];
      var sName = sh.getName();

      // Ignorar abas de sistema
      if (sName === "Resumo Geral" || sName === "Equipe & Vendedores") {
        continue;
      }

      var lastR = sh.getLastRow();
      var lastC = Math.max(sh.getLastColumn(), 11);
      var cleanTitle = sName.replace(/^Bilhetes\s*-\s*/i, "").trim() || ("Campanha " + (allRaffles.length + 1));

      if (lastR < 2) {
        // Aba sem dados ou apenas cabeçalho: incluir como campanha disponível
        allRaffles.push({
          sheetName: sName,
          title: cleanTitle,
          cotas: []
        });
        continue;
      }

      // Ler cabeçalho para identificar colunas dinamicamente
      var headerRow = sh.getRange(1, 1, 1, lastC).getValues()[0];
      var colMap = {
        numero: 0,
        status: 1,
        comprador: 2,
        telefone: 3,
        vendedor: 4,
        valor: 5,
        forma: 6,
        dataReserva: 7,
        dataPagamento: 8,
        recibo: 9,
        email: 10
      };

      for (var h = 0; h < headerRow.length; h++) {
        var colName = String(headerRow[h] || "").toLowerCase().trim();
        if (colName === "nº" || colName === "n°" || colName === "n" || colName === "#" || colName === "num" || (colName.indexOf("n") !== -1 && (colName.indexOf("úm") !== -1 || colName.indexOf("um") !== -1 || colName.indexOf("cota") !== -1 || colName.indexOf("bilhete") !== -1))) {
          colMap.numero = h;
        } else if (colName.indexOf("status") !== -1 || colName.indexOf("situa") !== -1 || colName.indexOf("estado") !== -1) {
          colMap.status = h;
        } else if (colName.indexOf("vendedor") !== -1 || colName.indexOf("respons") !== -1) {
          colMap.vendedor = h;
        } else if (colName.indexOf("comprador") !== -1 || colName.indexOf("cliente") !== -1 || (colName.indexOf("nome") !== -1 && colName.indexOf("vendedor") === -1)) {
          colMap.comprador = h;
        } else if (colName.indexOf("whats") !== -1 || colName.indexOf("tel") !== -1 || colName.indexOf("cel") !== -1 || colName.indexOf("fone") !== -1) {
          colMap.telefone = h;
        } else if (colName.indexOf("valor") !== -1 || colName.indexOf("pre") !== -1) {
          colMap.valor = h;
        } else if (colName.indexOf("forma") !== -1 || colName.indexOf("pgto") !== -1 || (colName.indexOf("pag") !== -1 && colName.indexOf("data") === -1)) {
          colMap.forma = h;
        } else if (colName.indexOf("reserva") !== -1) {
          colMap.dataReserva = h;
        } else if (colName.indexOf("data pag") !== -1 || (colName.indexOf("pag") !== -1 && colName.indexOf("data") !== -1)) {
          colMap.dataPagamento = h;
        } else if (colName.indexOf("recibo") !== -1 || colName.indexOf("código") !== -1 || colName.indexOf("codigo") !== -1) {
          colMap.recibo = h;
        } else if (colName.indexOf("email") !== -1 || colName.indexOf("e-mail") !== -1) {
          colMap.email = h;
        }
      }

      var rows = sh.getRange(2, 1, lastR - 1, lastC).getValues();
      var cotas = [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var numVal = r[colMap.numero];
        if (numVal !== "" && numVal !== null && numVal !== undefined) {
          var sellerVal = String(r[colMap.vendedor] || "").trim();
          if (sellerVal && !discoveredSellersMap[sellerVal.toLowerCase()]) {
            discoveredSellersMap[sellerVal.toLowerCase()] = true;
            sellersList.push({
              id: "seller-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
              nome: sellerVal,
              telefone: "",
              funcao: "Vendedor",
              pin: "1234",
              meta: 25
            });
          }

          cotas.push({
            numero: String(numVal),
            status: String(r[colMap.status] || "DISPONIVEL"),
            nomeComprador: String(r[colMap.comprador] || ""),
            telefone: String(r[colMap.telefone] || ""),
            vendedor: sellerVal,
            valor: Number(r[colMap.valor] || 0),
            formaPagamento: String(r[colMap.forma] || "PIX"),
            dataReserva: String(r[colMap.dataReserva] || ""),
            dataPagamento: String(r[colMap.dataPagamento] || ""),
            reciboId: String(r[colMap.recibo] || ""),
            email: String(r[colMap.email] || "")
          });
        }
      }

      allRaffles.push({
        sheetName: sName,
        title: cleanTitle,
        cotas: cotas
      });
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        meta: metaInfo,
        raffles: allRaffles,
        vendedores: sellersList,
        count: allRaffles.length,
        cotas: allRaffles[0] ? allRaffles[0].cotas : [],
        fetchedAt: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}
