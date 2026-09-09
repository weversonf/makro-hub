// Dados Oficiais do Espelho de Ponto - Weverson Nascimento (weversonf@gmail.com)
// Extraídos diretamente dos registros do sistema oficial de ponto Makro
// Período: Agosto e Setembro de 2026

export const OFFICIAL_WEVERSON_CONFIG = {
  saldoInicialMin: -2726, // -45:26 (Saldo Anterior consolidado antes de 01/08/2026)
  entrada: '07:50',
  saida: '17:38',
  horasAlmoco: 1,
  diasSemana: [1, 2, 3, 4, 5],
  salario: 0
};

export const OFFICIAL_WEVERSON_REGISTROS = [
  // ==========================================
  // AGOSTO / 2026
  // ==========================================
  { date: '2026-08-07', entrada: '08:40', saida: '', saldo: '--', status: 'incompleto' },
  { date: '2026-08-10', entrada: '08:44', saida: '17:51', saldo: '-00:41', status: 'completo' },
  { date: '2026-08-11', entrada: '08:30', saida: '17:47', saldo: '-00:31', status: 'completo' },
  { date: '2026-08-12', entrada: '08:29', saida: '17:57', saldo: '-00:20', status: 'completo' },
  { date: '2026-08-13', entrada: '08:32', saida: '17:46', saldo: '-00:34', status: 'completo' },
  { date: '2026-08-14', entrada: '08:20', saida: '17:59', saldo: '-00:09', status: 'completo' },
  { date: '2026-08-15', entrada: '', saida: '', saldo: 'Feriado', feriado: true, status: 'feriado' },
  { date: '2026-08-17', entrada: '08:48', saida: '17:44', saldo: '-00:52', status: 'completo' },
  { date: '2026-08-18', entrada: '08:32', saida: '17:40', saldo: '-00:40', status: 'completo' },
  { date: '2026-08-19', entrada: '08:25', saida: '18:12', saldo: '-00:01', status: 'completo' },
  { date: '2026-08-20', entrada: '08:26', saida: '', saldo: '--', status: 'incompleto' },
  { date: '2026-08-21', entrada: '08:27', saida: '11:59', saldo: '-06:16', status: 'completo' },
  { date: '2026-08-24', entrada: '08:17', saida: '', saldo: '--', status: 'incompleto' },
  { date: '2026-08-25', entrada: '08:50', saida: '18:36', saldo: '-00:02', status: 'completo' },
  { date: '2026-08-26', entrada: '06:48', saida: '18:20', saldo: '+01:44', status: 'completo' },
  { date: '2026-08-27', entrada: '08:06', saida: '18:27', saldo: '+00:33', status: 'completo' },
  { date: '2026-08-28', entrada: '09:22', saida: '17:50', saldo: '-01:20', status: 'completo' },
  { date: '2026-08-31', entrada: '09:11', saida: '18:01', saldo: '-00:58', status: 'completo' },

  // ==========================================
  // SETEMBRO / 2026
  // ==========================================
  { date: '2026-09-01', entrada: '08:28', saida: '18:08', saldo: '+00:52', status: 'completo' },
  { date: '2026-09-02', entrada: '08:39', saida: '17:53', saldo: '-00:34', status: 'completo' },
  { date: '2026-09-03', entrada: '08:22', saida: '', saldo: '--', status: 'incompleto' },
  { date: '2026-09-04', entrada: '08:17', saida: '17:43', saldo: '-00:22', status: 'completo' },
  { date: '2026-09-07', entrada: '', saida: '', saldo: 'Feriado', feriado: true, status: 'feriado' },
  { date: '2026-09-08', entrada: '08:22', saida: '18:01', saldo: '+00:51', status: 'completo' },
  { date: '2026-09-09', entrada: '08:14', saida: '', saldo: '--', status: 'em-andamento' }
];

export const OFFICIAL_WEVERSON_MANUAL = [
  {
    id: 'fechamento-ago-2026',
    ref: 'AGO/26',
    hrsStr: '23:05',
    decimal: 23.0833,
    tipo: 'negativo',
    motivo: 'Ajuste oficial de fechamento de período (saldo do período oficial: -33:12 | total banco: -78:38)',
    createdAt: '2026-08-31T23:59:59.000Z',
    createdBy: 'Fechamento Oficial RH/Tangerino'
  }
];
