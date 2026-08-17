import type {Metadata} from 'next';
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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-[#fdfaf7] antialiased min-h-screen text-[#423d38] selection:bg-[#D48166] selection:text-white">{children}</body>
    </html>
  );
}
