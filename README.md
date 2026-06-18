# Derci CRM

CRM web mobile-first em **português do Brasil** para uma profissional / pequena clínica de psicologia. Foi pensado para uma usuária de aproximadamente 65 anos: fonte e botões grandes, fluxos guiados, baixa carga cognitiva e mensagens claras de feedback.

## O que o sistema faz

- Gestão de **contatos e pacientes** (com origem, status, indicação, histórico, observações).
- **Planos de tratamento** de 2, 4 ou 6 sessões com regra automática de saldo, finalização e geração de tarefa de renovação.
- **Agenda de atendimentos** com visões dia / semana / mês.
- Registro de **sessões realizadas** com descrição breve (com aviso de privacidade).
- **Tarefas semanais** com tipos pré-definidos, comentários, comentário geral da semana e navegação por semana.
- **Pagamentos** com forma, categoria e status (pago / pendente / atrasado / cancelado).
- **Financeiro mensal** (entradas, saídas, saldo, filtros).
- **Mensagens para o financeiro** (Juliana / financeiro).
- **Fechamento e reabertura de prontuário** com motivo e timeline.
- **Histórico (timeline) do paciente** com eventos automáticos.
- **Compartilhar paciente via WhatsApp** com mensagem pré-preenchida.
- **Dashboard inicial** com cards e listas de ações urgentes.
- **Relatórios** operacionais e financeiros (gráficos com Recharts).
- **Usuários** com perfis preparados (`ADMIN`, `ATENDIMENTO`, `FINANCEIRO`) para permissões futuras — no MVP, todos os logados acessam tudo.

## Stack

- [Next.js 14](https://nextjs.org) com App Router + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + componentes estilo [shadcn/ui](https://ui.shadcn.com)
- [Prisma](https://prisma.io) + **PostgreSQL** (Heroku Postgres em produção)
- Autenticação **própria por JWT em cookie httpOnly** (login/senha com bcrypt) — sem dependência externa
- [Zod](https://zod.dev) + [React Hook Form](https://react-hook-form.com) (formulários simples usam Server Actions)
- [Recharts](https://recharts.org) para gráficos
- [date-fns](https://date-fns.org) com locale `pt-BR`

## Pré-requisitos

- Node 20+ (recomendado 20 LTS) **ou** Docker
- PostgreSQL 14+ (ou usar Docker Compose)

## Rodar localmente com Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

A primeira execução:

1. Sobe o **PostgreSQL** local na porta `5432`.
2. Aplica as migrações.
3. Roda o seed (cria usuário admin e dados fictícios).
4. Sobe a aplicação em `http://localhost:3000`.

Em execuções seguintes, o seed só roda se `RUN_SEED=true` (padrão). Para evitar reseed:

```bash
RUN_SEED=false docker compose up
```

**Login padrão (seed):**

- E-mail: `admin@derci.local`
- Senha: `admin123`

Outros usuários para testar perfis:

- `atendimento@derci.local` / `atendimento123`
- `financeiro@derci.local` / `financeiro123`

## Rodar localmente sem Docker

```bash
cp .env.example .env
# Edite DATABASE_URL apontando para um Postgres local
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse `http://localhost:3000`.

### Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor Next.js em modo desenvolvimento |
| `npm run build` | Build de produção (gera Prisma Client + Next) |
| `npm run start` | Inicia servidor de produção |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run db:deploy` | Aplica migrations em produção |
| `npm run db:seed` | Popular banco com dados fictícios |
| `npm run db:reset` | Apaga e recria o banco |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm test` | Rodar testes (vitest) |

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | URL do Postgres (em produção/Heroku, com `?sslmode=require`) |
| `AUTH_SECRET` | Chave para assinar o JWT da sessão (mínimo 32 caracteres). Gere com `openssl rand -base64 48`. |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação (usada no link compartilhável via WhatsApp). |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | Credenciais do admin criado pelo seed. **Troque a senha após o primeiro login.** |

## Deploy no Heroku

1. **Criar app e provisionar Postgres:**
   ```bash
   heroku create seu-app
   heroku addons:create heroku-postgresql:essential-0 --app seu-app
   ```

2. **Definir as variáveis de ambiente:**
   ```bash
   heroku config:set AUTH_SECRET="$(openssl rand -base64 48)" --app seu-app
   heroku config:set NEXT_PUBLIC_APP_URL="https://seu-app.herokuapp.com" --app seu-app
   heroku config:set SEED_ADMIN_EMAIL="seu@email.com" SEED_ADMIN_PASSWORD="trocar-em-producao" --app seu-app
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

   Heroku usa o `Procfile`:
   - `release: npx prisma migrate deploy` aplica as migrações automaticamente a cada deploy.
   - `web: npm run start` sobe o Next.js.

4. **(Opcional) Popular dados fictícios na primeira vez:**
   ```bash
   heroku run "npx prisma db seed" --app seu-app
   ```
   Em produção real você normalmente NÃO roda o seed, pois ele apaga dados de demo. Só use no primeiro setup.

5. **SSL no Postgres:** o Heroku Postgres usa SSL. O Prisma respeita o `?sslmode=require` se você acrescentar à `DATABASE_URL`. Se der problema, use o complemento [`pgssl`](https://www.heroku.com/postgres) ou ajuste `DATABASE_URL` manualmente.

Você também pode usar o `app.json` para deploy via botão "Deploy to Heroku".

## Privacidade e segurança (MVP)

- **Login obrigatório** em todas as rotas internas (middleware redireciona para `/login`).
- Senhas armazenadas com **bcrypt**.
- Sessão via **JWT em cookie httpOnly + sameSite=lax**, expira em 7 dias.
- Variáveis sensíveis em `.env` (nunca commitadas).
- O campo `summary` da sessão e `internalNotes` do paciente recebem aviso explícito para conter **apenas descrições breves e objetivas** — evite registrar dados clínicos sensíveis ou identificáveis no MVP. O comentário no `prisma/schema.prisma` reforça isso.
- Logs do Prisma em produção limitados a `error`.
- Seeds usam apenas dados **fictícios**.

## Estrutura

```
src/
├── app/
│   ├── (app)/                # área autenticada (com layout próprio)
│   │   ├── page.tsx          # dashboard
│   │   ├── pacientes/...
│   │   ├── agenda/...
│   │   ├── tarefas/...
│   │   ├── financeiro/...
│   │   ├── relatorios/...
│   │   └── configuracoes/usuarios/...
│   ├── login/                # tela pública
│   ├── api/auth/logout/      # logout via POST
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                   # primitivos (button, card, input, dialog, ...)
│   ├── nav/                  # navegação mobile e desktop
│   ├── patient/              # formulário e ações do paciente
│   ├── plan/, payment/, appointment/, task/, finance/, users/, reports/
├── lib/                      # auth, prisma, utils, validações, formatters, semana
├── server/                   # server actions e timeline
└── middleware.ts             # protege rotas autenticadas
prisma/
├── schema.prisma             # schema completo
└── seed.ts                   # seed fictício
tests/                        # vitest (regras de negócio + helpers)
docker-compose.yml            # postgres + app
Dockerfile
Procfile                      # Heroku
app.json                      # Heroku button
```

## Fluxos principais (já implementados)

1. **Cadastrar contato** → status inicial; se `EM_NEGOCIACAO`, cria tarefa automática.
2. **Converter em paciente** → mudar status para `ATIVO`, criar plano, registrar pagamento.
3. **Agendar sessão** → escolher paciente + data/hora; salva como `AGENDADO`.
4. **Marcar como realizado** → exige plano `ABERTO` com saldo. Decrementa 1 sessão. Se zerar, finaliza plano e cria tarefa automática de **renovação**.
5. **Registrar pagamento** → atualiza plano para `ABERTO`, gera lançamento financeiro e mensagem para o financeiro.
6. **Tarefas da semana** → criar, mudar status, comentar; comentários ficam no histórico; comentário geral por semana.
7. **Fechar prontuário** → motivo + data; status `FECHADO`; deixa de aparecer como ativo.
8. **Reabrir prontuário** → motivo + novo status (`ATIVO` ou `EM_NEGOCIACAO`); permite novo plano.

## Testes

```bash
npm test
```

Os testes cobrem:

- Helpers de **semana** (`getWeekStart`, `getWeekEnd`, etc.)
- Helpers de **formatação** (`formatBRL`, `fmtPhone`, ...)
- Regra de **consumo de sessão** (decremento, finalização, bloqueios).

## Próximos passos sugeridos (fora do MVP)

- Permissões finas baseadas em `role`.
- Anexos / documentos por paciente (com criptografia).
- Notificações por e-mail / WhatsApp.
- Snapshot semanal de indicadores (tabela `WeeklySnapshot`) para histórico imutável.
- Logs de auditoria.
- Modo escuro automático.
- PWA / instalável no celular.

---

Feito com cuidado para ser usado de verdade, todos os dias, no celular.
# derci-crm
