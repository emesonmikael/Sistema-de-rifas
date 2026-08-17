import { Raffle, Seller, SystemData } from '@/types/raffle';

export const INITIAL_SELLERS: Seller[] = [
  {
    id: 'seller-1',
    name: 'Francisco Alves (Coordenação)',
    phone: '(88) 99876-5432',
    email: 'franciscoalves258@gmail.com',
    pixKey: 'franciscoalves258@gmail.com',
    role: 'admin',
    targetNumbers: 20,
    avatarColor: 'bg-emerald-600',
    active: true,
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'seller-2',
    name: 'Maria Silva (Pastoral)',
    phone: '(88) 98765-4321',
    email: 'maria.silva@email.com',
    pixKey: 'maria.pastoral@pix.com',
    role: 'seller',
    targetNumbers: 15,
    avatarColor: 'bg-blue-600',
    active: true,
    createdAt: '2026-08-02T14:30:00Z',
  },
  {
    id: 'seller-3',
    name: 'João Pedro (Juventude)',
    phone: '(88) 99123-4567',
    email: 'joao.pedro@email.com',
    role: 'seller',
    targetNumbers: 15,
    avatarColor: 'bg-amber-600',
    active: true,
    createdAt: '2026-08-03T09:15:00Z',
  },
  {
    id: 'seller-4',
    name: 'Ana Clara (Comunidade)',
    phone: '(88) 99345-6789',
    role: 'seller',
    targetNumbers: 10,
    avatarColor: 'bg-purple-600',
    active: true,
    createdAt: '2026-08-04T16:00:00Z',
  },
];

// Generate initial numbers (50 numbers as default to demonstrate a full realistic parish raffle)
function generateInitialNumbers(): Record<number, Raffle['numbers'][number]> {
  const numbers: Record<number, Raffle['numbers'][number]> = {};
  const total = 50;

  for (let i = 1; i <= total; i++) {
    numbers[i] = {
      number: i,
      status: 'available',
    };
  }

  // Pre-seed some realistic sales to show off financial reports, ranking & audit table immediately
  const sampleSales = [
    { num: 1, buyer: 'Antônio Ferreira', phone: '(88) 99777-1122', sellerId: 'seller-1', sellerName: 'Francisco Alves (Coordenação)', method: 'PIX' as const, status: 'paid' as const },
    { num: 4, buyer: 'Cláudia Mendes', phone: '(88) 99888-2233', sellerId: 'seller-2', sellerName: 'Maria Silva (Pastoral)', method: 'DINHEIRO' as const, status: 'paid' as const },
    { num: 7, buyer: 'Marcos Vinícius', phone: '(88) 99666-3344', sellerId: 'seller-3', sellerName: 'João Pedro (Juventude)', method: 'PIX' as const, status: 'paid' as const },
    { num: 8, buyer: 'Luciana Bezerra', phone: '(88) 99555-4455', sellerId: 'seller-1', sellerName: 'Francisco Alves (Coordenação)', method: 'PIX' as const, status: 'paid' as const },
    { num: 10, buyer: 'José Ribamar', phone: '(88) 99444-5566', sellerId: 'seller-2', sellerName: 'Maria Silva (Pastoral)', method: 'DINHEIRO' as const, status: 'paid' as const },
    { num: 12, buyer: 'Teresa Cristina', phone: '(88) 99333-6677', sellerId: 'seller-4', sellerName: 'Ana Clara (Comunidade)', method: 'PIX' as const, status: 'paid' as const },
    { num: 15, buyer: 'Gabriel Santos', phone: '(88) 99222-7788', sellerId: 'seller-3', sellerName: 'João Pedro (Juventude)', method: 'PIX' as const, status: 'paid' as const },
    { num: 18, buyer: 'Raimundo Nonato', phone: '(88) 99111-8899', sellerId: 'seller-1', sellerName: 'Francisco Alves (Coordenação)', method: 'DINHEIRO' as const, status: 'paid' as const },
    { num: 20, buyer: 'Francisca Lima', phone: '(88) 99000-9900', sellerId: 'seller-2', sellerName: 'Maria Silva (Pastoral)', method: 'PIX' as const, status: 'paid' as const },
    { num: 23, buyer: 'Paulo Henrique', phone: '(88) 98888-0011', sellerId: 'seller-1', sellerName: 'Francisco Alves (Coordenação)', method: 'PIX' as const, status: 'paid' as const },
    { num: 27, buyer: 'Helena Carvalho', phone: '(88) 98777-1122', sellerId: 'seller-3', sellerName: 'João Pedro (Juventude)', method: 'PIX' as const, status: 'paid' as const },
    // Reserved
    { num: 2, buyer: 'Carlos Eduardo', phone: '(88) 98666-2233', sellerId: 'seller-2', sellerName: 'Maria Silva (Pastoral)', method: 'PIX' as const, status: 'reserved' as const },
    { num: 5, buyer: 'Beatriz Vasconcelos', phone: '(88) 98555-3344', sellerId: 'seller-4', sellerName: 'Ana Clara (Comunidade)', method: 'PIX' as const, status: 'reserved' as const },
    { num: 9, buyer: 'Fernando Rocha', phone: '(88) 98444-4455', sellerId: 'seller-1', sellerName: 'Francisco Alves (Coordenação)', method: 'PIX' as const, status: 'reserved' as const },
  ];

  sampleSales.forEach((sale) => {
    if (numbers[sale.num]) {
      numbers[sale.num] = {
        number: sale.num,
        status: sale.status,
        buyerName: sale.buyer,
        buyerPhone: sale.phone,
        sellerId: sale.sellerId,
        sellerName: sale.sellerName,
        paymentMethod: sale.method,
        reservedAt: '2026-08-15T10:00:00Z',
        paidAt: sale.status === 'paid' ? '2026-08-15T11:20:00Z' : undefined,
        receiptId: `REC-${sale.num.toString().padStart(3, '0')}-8829`,
        amountPaid: sale.status === 'paid' ? 10 : undefined,
      };
    }
  });

  return numbers;
}

export const INITIAL_RAFFLE: Raffle = {
  id: 'raffle-sao-jose-operario',
  title: 'RIFA PIX PARA SÃO JOSÉ OPERÁRIO',
  category: 'Ação Beneficente Paroquial',
  causeDescription:
    'Em prol da aquisição de um aparelho celular para a comunicação e criação da rede social da capela de São José Operário da Vaca Morta.',
  chapelOrOrgName: 'Capela de São José Operário da Vaca Morta',
  location: 'Comunidade Vaca Morta',
  bannerTheme: 'sacred-green',
  prizes: [
    {
      order: 1,
      title: '1º PRÊMIO',
      description: 'Cafeteira Elétrica Mondial e Faqueiro Completo Inox 24 peças',
      badge: 'Principal',
      iconName: 'Coffee',
      donorName: 'Doação da Família Alves & Devotos de São José',
      estimatedValue: 280,
      details: 'Cafeteira Elétrica automática com jarra de inox + Faqueiro completo em aço inox resistente Tramontina.',
    },
    {
      order: 2,
      title: '2º PRÊMIO',
      description:
        'Uma unha completa (manicure e pedicure) e Uma Pós-graduação EaD em qualquer Área totalmente paga e reconhecida pelo MEC',
      badge: 'Especial',
      iconName: 'GraduationCap',
      donorName: 'Parceria Studio Estética & Instituto Educacional EaD',
      estimatedValue: 1200,
      details: 'Sessão completa de cuidados estéticos nas unhas com esmaltação premium + Bolsa integral 100% gratuita para curso de pós-graduação lato sensu reconhecido pelo MEC com certificado.',
    },
  ],
  pricePerNumber: 10,
  totalNumbers: 50,
  pixKey: 'franciscoalves258@gmail.com',
  pixKeyType: 'email',
  pixReceiverName: 'Francisco Alves - Capela São José Operário',
  pixCity: 'Vaca Morta',
  drawDate: '2026-09-01',
  drawTime: '19:30',
  drawLocation: 'Transmissão Ao Vivo na Capela São José Operário e no Instagram Oficial',
  regulation: '1. A presente rifa é de caráter beneficente em prol da Capela de São José Operário da Vaca Morta.\n2. O sorteio será realizado ao vivo no dia 01/09/2026 às 19:30 com auditoria pública.\n3. Participam do sorteio todas as cotas devidamente pagas e confirmadas até às 18:00 do dia do sorteio.\n4. O ganhador será contatado via ligação telefônica e WhatsApp oficial da coordenação.\n5. O prêmio poderá ser retirado na secretaria da Capela ou enviado conforme combinação com o contemplado.',
  notes: 'Meta: aquisição do celular comunitário para transmissão das missas e avisos da comunidade.',
  status: 'active',
  numbers: generateInitialNumbers(),
  winners: [],
  expenses: [
    {
      id: 'exp-1',
      description: 'Impressão de cartazes físicos e panfletos',
      amount: 35.0,
      category: 'divulgacao',
      date: '2026-08-05',
      registeredBy: 'Francisco Alves',
    },
  ],
  reservationTimeoutHours: 24,
  createdAt: '2026-08-01T08:00:00Z',
  updatedAt: '2026-08-17T08:30:00Z',
};

export const INITIAL_SYSTEM_DATA: SystemData = {
  raffles: [INITIAL_RAFFLE],
  activeRaffleId: 'raffle-sao-jose-operario',
  sellers: INITIAL_SELLERS,
  currentSellerId: 'seller-1',
};
