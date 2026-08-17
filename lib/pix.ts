/**
 * PIX EMV QR Code & Payload Generator Helper
 */

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function tlv(id: string, value: string): string {
  const len = pad2(value.length);
  return `${id}${len}${value}`;
}

// CRC16-CCITT calculation for PIX EMV standard
function crc16(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  const hex = (crc & 0xffff).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

export function generatePixPayload({
  pixKey,
  receiverName,
  city,
  amount,
  transactionId = '***',
}: {
  pixKey: string;
  receiverName: string;
  city: string;
  amount?: number;
  transactionId?: string;
}): string {
  // Format clean strings
  const cleanKey = pixKey.trim();
  const cleanName = receiverName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25).trim() || 'RECEBEDOR';
  const cleanCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15).trim() || 'BRASIL';
  const cleanTxId = (transactionId || 'RIFA').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || 'RIFA';

  // 00 - Payload Format Indicator (01)
  let payload = tlv('00', '01');

  // 26 - Merchant Account Information (GUI + Key)
  const gui = tlv('00', 'br.gov.bcb.pix');
  const key = tlv('01', cleanKey);
  payload += tlv('26', gui + key);

  // 52 - Merchant Category Code
  payload += tlv('52', '0000');

  // 53 - Transaction Currency (986 = BRL)
  payload += tlv('53', '986');

  // 54 - Transaction Amount (optional)
  if (amount && amount > 0) {
    payload += tlv('54', amount.toFixed(2));
  }

  // 58 - Country Code
  payload += tlv('58', 'BR');

  // 59 - Merchant Name
  payload += tlv('59', cleanName);

  // 60 - Merchant City
  payload += tlv('60', cleanCity);

  // 62 - Additional Data Field Template (TxId)
  const refLabel = tlv('05', cleanTxId);
  payload += tlv('62', refLabel);

  // 63 - CRC16
  payload += '6304';
  const checksum = crc16(payload);

  return payload + checksum;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function generateWhatsAppLink({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}
