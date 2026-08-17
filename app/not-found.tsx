import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fdfaf7] text-[#2d2a26] text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center text-2xl font-mono font-black mb-4 shadow-sm">
        404
      </div>
      <h2 className="text-xl font-bold font-serif mb-2">Página Não Encontrada</h2>
      <p className="text-xs text-[#7c736a] max-w-sm mb-6">
        A página solicitada não foi localizada. Retorne para a página inicial da rifa.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#484832] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
      >
        Voltar para a Rifa
      </Link>
    </div>
  );
}
