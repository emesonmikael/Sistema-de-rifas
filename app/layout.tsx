import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RifaPix - Sistema de Rifas, Balcão de Vendedores e Controle Financeiro',
  description: 'Sistema completo para gestão de rifas beneficentes com grade interativa, controle de pagamentos PIX/Dinheiro por vendedores e relatórios financeiros automáticos.',
  openGraph: {
    title: 'RifaPix - Sistema de Rifas e Gestão Financeira',
    description: 'Sistema completo para gestão de rifas beneficentes com grade interativa, controle de pagamentos PIX/Dinheiro por vendedores e relatórios financeiros automáticos.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#5A5A40',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[#fdfaf7] antialiased min-h-screen text-[#423d38] selection:bg-[#D48166] selection:text-white overscroll-y-none"
      >
        {children}
      </body>
    </html>
  );
}
