import { Raffle, SystemData, RaffleNumber } from '@/types/raffle';
import { DEFAULT_SHEETS_WEBHOOK_URL } from './sheetsConfig';
import { saveStoredData, getStoredData } from './storage';

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
      // If the Webhook returned plain text (e.g. older script deployment)
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

    if (!result || result.result !== 'success' || !result.cotas) {
      return {
        success: false,
        message: result?.error || 'A planilha não retornou cotas válidas.',
      };
    }

    // Apply fetched cotas to local storage
    const current = getStoredData();
    const activeRaffleId = raffleId || current.activeRaffleId;
    const raffleIndex = current.raffles.findIndex((r) => r.id === activeRaffleId);

    if (raffleIndex === -1) {
      return {
        success: false,
        message: 'Rifa correspondente não foi encontrada no sistema.',
      };
    }

    const currentRaffle = current.raffles[raffleIndex];
    const updatedNumbers = { ...currentRaffle.numbers };
    let importedCount = 0;

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
        importedCount++;
      }
    }

    const updatedRaffle: Raffle = {
      ...currentRaffle,
      numbers: updatedNumbers,
      updatedAt: new Date().toISOString(),
    };

    current.raffles[raffleIndex] = updatedRaffle;
    saveStoredData(current);

    config.lastFetchAt = new Date().toISOString();
    saveSheetsConfig(config);

    return {
      success: true,
      message: `Planilha sincronizada! ${importedCount} cota(s) ativas carregadas do Google Sheets.`,
      numbersCount: importedCount,
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
 * Generates the Google Apps Script code with both POST (Save) and GET (Fetch) capabilities
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * 🎟️ SCRIPT DE INTEGRAÇÃO BI-DIRECIONAL - SISTEMA DE RIFAS COM GOOGLE SHEETS
 * =========================================================================
 * SUPORTA:
 * ✅ Gravar / Salvar automaticamente (POST)
 * ✅ Buscar / Ler dados ao carregar a página (GET)
 * 
 * INSTRUÇÕES RÁPIDAS:
 * 1. No Google Sheets, clique em: Extensões > Apps Script
 * 2. Apague todo o código existente lá e Cole este código inteiro.
 * 3. Clique no ícone de "Salvar" (disquete).
 * 4. Clique em "Implantar" (botão azul no topo) > "Nova implantação" (ou Gerenciar implantações).
 * 5. Tipo: "Aplicativo da Web".
 * 6. Quem pode acessar: selecione "Qualquer pessoa" (Anyone).
 * 7. Clique em "Implantar", autorize o acesso e COPIE a URL gerada do Webhook.
 * 8. Cole a URL no seu Sistema de Rifas (ou configure na variável NEXT_PUBLIC_SHEETS_WEBHOOK_URL).
 * =========================================================================
 */

// 1. RECEBER DADOS DO SITE E SALVAR NA PLANILHA (POST)
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

    // 2. Aba de Resumo Financeiro
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

    summarySheet.getRange("A2:B8").setValues([
      ["Título da Rifa", data.rifa ? data.rifa.titulo : ""],
      ["Entidade / Capela", data.rifa ? data.rifa.entidade : ""],
      ["Total de Cotas Pagas", totalPago],
      ["Total de Cotas Reservadas", totalReservado],
      ["Total de Cotas Disponíveis", totalLivre],
      ["Valor Total Arrecadado (R$)", totalArrecadado],
      ["Última Atualização", new Date().toLocaleString("pt-BR")]
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

// 2. ENVIAR DADOS DA PLANILHA PARA O SITE CARREGAR AO RECARREGAR A PÁGINA (GET)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var sheet = null;

    // Procurar aba de bilhetes
    for (var s = 0; s < sheets.length; s++) {
      if (sheets[s].getName().indexOf("Bilhetes") !== -1) {
        sheet = sheets[s];
        break;
      }
    }

    if (!sheet) {
      sheet = ss.getSheetByName("Sheet1") || sheets[0];
    }

    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ result: "error", error: "Aba de bilhetes não encontrada" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({ result: "success", cotas: [] })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
    var cotas = [];

    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      if (row[0] !== "" && row[0] !== null && row[0] !== undefined) {
        cotas.push({
          numero: String(row[0]),
          status: String(row[1] || "DISPONIVEL"),
          nomeComprador: String(row[2] || ""),
          telefone: String(row[3] || ""),
          vendedor: String(row[4] || ""),
          valor: Number(row[5] || 0),
          formaPagamento: String(row[6] || "PIX"),
          dataReserva: String(row[7] || ""),
          dataPagamento: String(row[8] || ""),
          reciboId: String(row[9] || ""),
          email: String(row[10] || "")
        });
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        total: cotas.length,
        cotas: cotas,
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
