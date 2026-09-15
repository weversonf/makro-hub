# Legacy - ferramentas Makro arquivadas

Importadas em 2026-09-15 dos repos standalone para centralizar no makro-hub.
Repos originais mantidos como backup em `backup-github-2026-09-15/`. Nao deletar do GitHub antes de validar.

| Pasta | Origem | Status | Observacao |
|---|---|---|---|
| `legacy/bancodehoras/` | `weversonf/bancodehoras` (Makro Time Intelligence, push Jul/2026) | CANONICO de horas | Manter. Usa Firebase do Hub (mytasks-saturday) |
| `legacy/extra-hours/` | `weversonf/minha-rota` (ExtraHours Makro v08, Mar/2026) | DEPRECIADO | Duplicata mais antiga do bancodehoras. Nao evoluir, so referencia |
| `legacy/saturday-tasks/` | `weversonf/Saturday` (SaaS Gestao v26, Abr/2026) | REFERENCIA | Base mytasks-saturday. Avaliar migrar Kanban para `src/` do Hub |
| `legacy/seminovos-catalogo/` | `weversonf/ccatalogo-seminovos` (v06, 1 commit) | REFERENCIA | Catalogo estatico pequeno. Avaliar virar modulo React |

Essas pastas sao estaticas e NAO entram no build Vite. Servem como arquivo vivo ate a migracao definitiva.
