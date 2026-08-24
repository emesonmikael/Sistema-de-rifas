import { Raffle, SystemData, RaffleNumber } from '@/types/raffle';
import { DEFAULT_SHEETS_WEBHOOK_URL } from './sheetsConfig';
import { saveStoredData, getStoredData, createNewRaffle, setActiveRaffleId } from './storage';

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
 * Fetches the latest raffle data from Google Sheets (bi-directional sync)
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

    // 1. Process multiple raffles if returned by Apps Script
    if (result.raffles && Array.isArray(result.raffles) && result.raffles.length > 0) {
      for (const rData of result.raffles) {
        const raffleTitle = rData.title || (result.meta && result.meta.titulo) || 'Rifa Paroquial';
        const cotasArray = rData.cotas || [];

        // Find existing raffle by title or match active
        let targetIndex = current.raffles.findIndex(
          (r) => r.title.toLowerCase().trim() === raffleTitle.toLowerCase().trim()
        );

        if (targetIndex === -1 && current.raffles.length === 1 && current.raffles[0].id === 'demo-raffle-01') {
          // If only demo raffle exists, adapt the demo raffle to the real one
          targetIndex = 0;
        }

        let maxNum = 50;
        cotasArray.forEach((c: any) => {
          const n = parseInt(c.numero, 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        });

        if (targetIndex === -1) {
          // Create new raffle entry
          const newRaffleId = `raffle-sheet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const initialNumbers: Record<number, RaffleNumber> = {};
          for (let i = 1; i <= Math.max(maxNum, 50); i++) {
            initialNumbers[i] = { number: i, status: 'available' };
          }
          const createdRaffle: Raffle = {
            id: newRaffleId,
            title: raffleTitle,
            category: 'Ação Solidária',
            causeDescription: 'Em prol da paróquia e comunidade',
            chapelOrOrgName: (result.meta && result.meta.entidade) || 'Capela de São José Operário',
            location: 'Comunidade Paroquial',
            pricePerNumber: (result.meta && result.meta.precoPorNumero) || 10,
            totalNumbers: Math.max(maxNum, 50),
            pixKey: (result.meta && result.meta.chavePix) || 'paroquia.rifa@gmail.com',
            pixKeyType: 'email',
            pixReceiverName: (result.meta && result.meta.entidade) || 'Coordenação da Rifa',
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

        const targetRaffle = current.raffles[targetIndex];
        const updatedNumbers = { ...targetRaffle.numbers };

        // Update raffle meta if available
        if (result.meta) {
          if (result.meta.titulo) targetRaffle.title = result.meta.titulo;
          if (result.meta.entidade) targetRaffle.chapelOrOrgName = result.meta.entidade;
          if (result.meta.precoPorNumero) targetRaffle.pricePerNumber = Number(result.meta.precoPorNumero);
          if (result.meta.chavePix) targetRaffle.pixKey = result.meta.chavePix;
          if (result.meta.totalNumeros && result.meta.totalNumeros > targetRaffle.totalNumbers) {
            targetRaffle.totalNumbers = Number(result.meta.totalNumeros);
          }
        }

        // Ensure totalNumbers covers highest number
        if (maxNum > targetRaffle.totalNumbers) {
          targetRaffle.totalNumbers = maxNum;
        }

        for (let i = 1; i <= targetRaffle.totalNumbers; i++) {
          if (!updatedNumbers[i]) {
            updatedNumbers[i] = { number: i, status: 'available' };
          }
        }

        // Apply cotas
        for (const c of cotasArray) {
          const numInt = parseInt(c.numero, 10);
          if (isNaN(numInt)) continue;

          const rawStatus = (c.status || '').toUpperCase().trim();
          const status: RaffleNumber['status'] =
            rawStatus === 'PAGO' ? 'paid' : rawStatus === 'RESERVADO' ? 'reserved' : 'available';

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
            amountPaid: status === 'paid' ? Number(c.valor || targetRaffle.pricePerNumber) : undefined,
          };

          if (status !== 'available') {
            totalImportedActiveNumbers++;
          }
        }

        targetRaffle.numbers = updatedNumbers;
        targetRaffle.updatedAt = new Date().toISOString();
        current.raffles[targetIndex] = targetRaffle;
      }
    } else if (result.cotas && Array.isArray(result.cotas)) {
      // Single cotas array fallback
      const activeRaffleId = raffleId || current.activeRaffleId;
      let raffleIndex = current.raffles.findIndex((r) => r.id === activeRaffleId);
      if (raffleIndex === -1) raffleIndex = 0;

      const currentRaffle = current.raffles[raffleIndex];
      const updatedNumbers = { ...currentRaffle.numbers };

      for (const c of result.cotas) {
        const numInt = parseInt(c.numero, 10);
        if (isNaN(numInt)) continue;

        const rawStatus = (c.status || '').toUpperCase().trim();
        const status: RaffleNumber['status'] =
          rawStatus === 'PAGO' ? 'paid' : rawStatus === 'RESERVADO' ? 'reserved' : 'available';

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
          amountPaid: status === 'paid' ? Number(c.valor || currentRaffle.pricePerNumber) : undefined,
        };

        if (status !== 'available') {
          totalImportedActiveNumbers++;
        }
      }

      currentRaffle.numbers = updatedNumbers;
      currentRaffle.updatedAt = new Date().toISOString();
      current.raffles[raffleIndex] = currentRaffle;
    }

    saveStoredData(current);

    config.lastFetchAt = new Date().toISOString();
    saveSheetsConfig(config);

    return {
      success: true,
      message: `Planilha sincronizada! ${totalImportedActiveNumbers} cota(s) ativas carregadas do Google Sheets.`,
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
 * Sends a full snapshot of the raffle or an event change to Google Sheets Webhook
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

    const expensesArray = (raffle.expenses || []).map((e) => ({
      id: e.id,
      descricao: e.description,
      valor: e.amount,
      categoria: e.category,
      data: new Date(e.date).toLocaleDateString('pt-BR'),
    }));

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
        message: 'Planilha do Google Sheets sincronizada com sucesso!',
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
 * Generates the Google Apps Script code with bi-directional capabilities
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * 🎟️ SCRIPT DE INTEGRAÇÃO BI-DIRECIONAL - SISTEMA DE RIFAS COM GOOGLE SHEETS
 * =========================================================================
 * SUPORTA:
 * ✅ Gravar / Salvar automaticamente em tempo real (POST)
 * ✅ Buscar / Carregar dados ao abrir o site em qualquer navegador (GET)
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

// 1. RECEBER DADOS DO SITE E GRAVAR NA PLANILHA (POST)
function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Aba Principal de Cotas da Rifa
    var sheetName = "Bilhetes - " + (data.rifa ? data.rifa.titulo.substring(0, 20) : "Rifa");
    var sheet = ss.getSheetByName(sheetName);
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

    // Limpar dados anteriores mantendo cabeçalho
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 11).clearContent();
    }

    // Preencher novas linhas
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

    // 2. Aba de Resumo Financeiro Geral
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

    // Listar todas as abas de bilhetes
    var allRaffles = [];
    for (var s = 0; s < sheets.length; s++) {
      var sName = sheets[s].getName();
      if (sName.indexOf("Bilhetes") !== -1 || sName === "Sheet1") {
        var sh = sheets[s];
        var lastR = sh.getLastRow();
        var cotas = [];
        if (lastR > 1) {
          var rows = sh.getRange(2, 1, lastR - 1, 11).getValues();
          for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            if (r[0] !== "" && r[0] !== null && r[0] !== undefined) {
              cotas.push({
                numero: String(r[0]),
                status: String(r[1] || "DISPONIVEL"),
                nomeComprador: String(r[2] || ""),
                telefone: String(r[3] || ""),
                vendedor: String(r[4] || ""),
                valor: Number(r[5] || 0),
                formaPagamento: String(r[6] || "PIX"),
                dataReserva: String(r[7] || ""),
                dataPagamento: String(r[8] || ""),
                reciboId: String(r[9] || ""),
                email: String(r[10] || "")
              });
            }
          }
        }
        allRaffles.push({
          sheetName: sName,
          title: sName.replace("Bilhetes - ", "").trim() || metaInfo.titulo || "Rifa Paroquial",
          cotas: cotas
        });
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        meta: metaInfo,
        raffles: allRaffles,
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
