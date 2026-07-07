# Makro Hub - Documentação do Projeto

## Visão Geral

O **Makro Hub** é um painel operacional interno da Makro Engenharia que consolida duas ferramentas em uma única interface:

- **Atividades** — Gestão de tarefas e calendário editorial
- **NPS** — Dashboard de Net Promoter Score com dados da planilha Google Sheets

A interface segue o visual dark theme com identidade visual Makro (vermelho `#ED1C24` sobre fundo `#010816`).

---

## Arquivos do Projeto

```
Makro/Teste/
├── hub_makro.html              ← Arquivo principal (produção)
├── Codigo.gs                   ← Google Apps Script (backend NPS)
├── atividades_e_calendario_editorial.html  ← Versão standalone das atividades (legado)
├── painel_nps.html             ← Versão standalone do NPS (legado)
└── README.md                   ← Este arquivo
```

### `hub_makro.html`
Arquivo principal que combina Atividades + NPS em uma interface única. Abra diretamente no navegador (não precisa de servidor).

### `Codigo.gs`
Script do Google Apps Script que serve como backend do módulo NPS. Deve ser publicado como Web App no Google Apps Script Editor.

### `atividades_e_calendario_editorial.html` (legado)
Versão standalone do módulo de atividades com tema claro. Não é mais utilizada.

### `painel_nps.html` (legado)
Versão standalone do módulo NPS com login. Não é mais utilizada.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + Tailwind CSS (CDN) |
| Ícones | Lucide Icons |
| Gráficos NPS | React 18 + Recharts |
| Transpilação | Babel Standalone |
| Banco de dados (Atividades) | Firebase Firestore |
| Backend NPS | Google Apps Script |
| Armazenamento local | localStorage (preferências do kanban) |

---

## Módulo: Atividades

### Funcionalidades

| Feature | Descrição |
|---------|-----------|
| **Dashboard** | KPIs (total, concluídas, pendentes, taxa), próximas atividades, canais de distribuição |
| **Kanban** | Board com drag & drop, colunas customizáveis, suporte a touch mobile |
| **Calendário** | Visualização mensal com posts agendados por dia |
| **Categorias** | CRUD de categorias com cores personalizadas |
| **Exportar** | Backup completo em JSON |

### Status do Kanban (padrão)

| Coluna | Cor | Descrição |
|--------|-----|-----------|
| Produção | Amarelo | Atividade em criação |
| Revisão | Azul | Aguardando revisão |
| Aprovação | Roxo | Aguardando aprovação |
| Concluído | Verde | Finalizada |

### Canais de Distribuição

Instagram (IG), Facebook (FB), LinkedIn (LI), Site, Blog

### Firebase

As atividades e categorias são persistidas no **Firebase Firestore** no projeto `mytasks-saturday`.

**Coleções utilizadas:**
- `activities` — Atividades criadas
- `categories` — Categorias personalizadas

---

## Módulo: NPS

### Funcionalidades

| Feature | Descrição |
|---------|-----------|
| **Dashboard** | KPIs (total, promotores, neutros, detratores, score NPS) |
| **Gráfico** | Série histórica com barras clicáveis para filtrar |
| **Filtros** | Mês, Unidade, Estratégico, Empresa, Cliente, Contrato |
| **Gráficos por Cliente/Unidade** | Rankings horizontais com NPS por segmento |
| **Tabela** | Respostas recentes com busca e paginação |
| **Exportar** | CSV filtrado ou completo |

### Fonte dos Dados

Os dados vêm de uma planilha Google Sheets via Google Apps Script (`Codigo.gs`).

**Abas utilizadas:**

| Aba | Uso |
|-----|-----|
| `NPS - MKE` | Respostas NPS da Makro Engenharia |
| `NPS - MKT` | Respostas NPS da Makro Transportes |
| `RESUMO` | Metas de aderência |
| `Contratos` | Lista de contratos para o formulário |

### Mapeamento de Colunas (NPS - MKE)

| Coluna | Índice | Campo |
|--------|--------|-------|
| A | 0 | Data |
| B | 1 | Número do Contrato |
| C | 2 | Unidade |
| E | 4 | Nome do Contrato |
| F | 5 | Responsável |
| G | 6 | Mês |
| T | 19 | Nota |
| V | 21 | Feedback |
| Y | 24 | Classificação |
| AC | 28 | Cliente |

### Mapeamento de Colunas (Contratos)

| Coluna | Índice | Campo |
|--------|--------|-------|
| A | 0 | Exibição (formato completo) |
| C | 2 | Número |
| D | 3 | Cliente |

### Zonas NPS

| Zona | Score | Cor |
|------|-------|-----|
| Excelência | ≥ 75 | Verde (#00A650) |
| Qualidade | ≥ 50 | Verde claro (#56C174) |
| Aperfeiçoamento | ≥ 0 | Amarelo (#FDB913) |
| Crítico | < 0 | Vermelho (#EF4136) |

---

## Publicação do Google Apps Script

1. Abra [script.google.com](https://script.google.com)
2. Crie um novo projeto ou abra o existente
3. Cole o conteúdo de `Codigo.gs`
4. Salve (Ctrl+S)
5. Clique em **Implementar** → **Nova implementação**
6. Tipo: **Aplicativo da Web**
7. Executar como: **Eu**
8. Quem tem acesso: **Qualquer pessoa**
9. Clique em **Implementar**
10. Copie a URL e atualize `SCRIPT_URL` no `hub_makro.html` se necessário

---

## Personalização

### Alterar o filtro "Contrato" no NPS

O filtro de Contrato mostra `contratoExibicao` que é construído no frontend combinando o número do contrato com o nome da lista de contratos (`listaContratos.exibicao`).

### Alterar colunas do Kanban

As colunas do Kanban são salvas no `localStorage` com a chave `makro_hub_kanban_cols`. Clique em "Editar Colunas" no Kanban para personalizar.

### Adicionar canais de distribuição

Edite o array `CHANNELS` no script de Atividades dentro de `hub_makro.html`:

```javascript
const CHANNELS = [
  { id: 'ig', label: 'IG', color: '#E1306C' },
  { id: 'fb', label: 'FB', color: '#1877F2' },
  // Adicione novos aqui
];
```

---

## Acesso

O `hub_makro.html` não possui tela de login. O acesso é feito diretamente pelo link. Para restringir, hospede em um servidor com autenticação própria.

---

## Compatibilidade

| Navegador | Suporte |
|-----------|---------|
| Chrome 90+ | ✅ Completo |
| Edge 90+ | ✅ Completo |
| Firefox 90+ | ✅ Completo |
| Safari 14+ | ✅ Completo |
| Mobile Chrome | ✅ Responsivo |
| Mobile Safari | ✅ Responsivo |

---

## Notas Técnicas

- O Tailwind CSS é carregado via CDN (`cdn.tailwindcss.com`) — adequado para uso interno, não recomendado para produção de alto tráfego
- O React é carregado em modo **development** para compatibilidade com Recharts UMD
- O Babel Standalone transpila JSX em tempo real no navegador
- Os dados do NPS são carregados via `fetch` para o Google Apps Script
- As atividades usam Firebase Firestore com listener `onSnapshot` para atualização em tempo real
