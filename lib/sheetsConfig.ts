// Default Google Apps Script Webhook URL
// You can set NEXT_PUBLIC_SHEETS_WEBHOOK_URL in Vercel Environment Variables or paste it directly in DEFAULT_SHEETS_WEBHOOK_URL below
export const DEFAULT_SHEETS_WEBHOOK_URL: string =
  process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL || '';
