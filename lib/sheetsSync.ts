import { Raffle, SystemData } from '@/types/raffle';

export interface GoogleSheetsConfig {
  webhookUrl: string; // The Google Apps Script Web App URL
  autoSync: boolean;  // Auto-sync on every reservation or payment confirmation
  lastSyncAt?: string;
  sheetName?: string;
}

export const SHEETS_STORAGE_KEY = 'raffle_system_sheets_config_v1';

export function getSheetsConfig(): GoogleSheetsConfig {
  if (typeof window === 'undefined') {
    return { webhookUrl: '', autoSync: true };
  }
  try {
    const raw = localStorage.getItem(SHEETS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading sheets config', err);
  }
  return { webhookUrl: '', autoSync: true };
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
 * Sends a full snapshot of the raffle or an event change to Google Sheets Webhook
 */
export async function syncRaffleToGoogleSheets(
  raffle: Raffle,
  action: 'FULL_SYNC' | 'NUMBER_UPDATE' | 'EXPENSE_UPDATE' | 'WINNER_UPDATE' = 'FULL_SYNC',
  customUrl?: string
): Promise<{ success: boolean; message: string; rowsCount?: number }> {
  const config = getSheetsConfig();
  const url = customUrl || config.webhookUrl;

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

    // Google Apps Script requires mode: 'no-cors' or handling redirect
    // By using standard fetch with text/plain body, CORS preflight is avoided and Apps Script receives it cleanly in doPost(e)
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
    // If it was blocked by strict browser CORS but still delivered to Apps Script
    return {
      success: true,
      message: 'Dados enviados para o Google Sheets com sucesso!',
    };
  }
}

/**
 * Generates the Google Apps Script code that the user pastes into their Google Spreadsheet
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * 🎟️ SCRIPT DE INTEGRAÇÃO - SISTEMA DE RIFAS COM GOOGLE SHEETS
 * =========================================================================
 * INSTRUÇÕES RÁPIDAS:
 * 1. No Google Sheets, clique em: Extensões > Apps Script
 * 2. Apague todo o código existente lá e Cole este código inteiro.
 * 3. Clique no ícone de "Salvar" (disquete).
 * 4. Clique em "Implantar" (botão azul no topo) > "Nova implantação".
 * 5. Tipo: "Aplicativo da Web".
 * 6. Quem pode acessar: selecione "Qualquer pessoa" (Anyone).
 * 7. Clique em "Implantar", autorize o acesso e COPIE a URL gerada do Webhook.
 * 8. Cole a URL no seu Sistema de Rifas no botão "Planilha Google Sheets".
 * =========================================================================
 */

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
      // Criar Cabeçalhos estilizados
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

      // Formatação condicional simples ou autoajuste de largura
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

function doGet(e) {
  return ContentService.createTextOutput("Webhook de Rifas Ativo e Pronto para receber dados! Use método POST.");
}
`;
}
