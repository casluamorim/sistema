# Racun HQ — Sistema de Gestão da Agência Racun

Sistema completo de gestão para agência de marketing, produtora audiovisual e casamentos.

---

## MÓDULOS DISPONÍVEIS

- **Dashboard** — KPIs, gráficos, alerta MEI, entregas atrasadas
- **CRM / Pipeline** — Kanban de leads com converter em cliente
- **Clientes** — Cadastro completo com briefing e checklist de onboarding
- **Entregas** — Kanban + lista com sistema de aprovação
- **Tráfego Pago** — Relatórios Meta Ads e Google Ads por cliente/mês
- **Financeiro** — Entradas, saídas, relatórios e alerta MEI
- **Agenda** — Calendário mensal com todos os tipos de evento
- **Casamentos** — Checklist por etapa, timeline e controle financeiro
- **Fornecedores** — Cadastro com avaliação e histórico
- **Equipamentos** — Inventário com alerta de manutenção
- **Propostas** — Gerador com controle de status
- **Configurações** — Dados da agência e metas

---

## CONFIGURAÇÃO PASSO A PASSO

### 1. Clone o repositório

```bash
git clone https://github.com/casluamorim/sistema.git
cd sistema
npm install
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Nomeie o projeto: **racun-hq**
3. Aguarde o projeto inicializar (~2 minutos)
4. Vá em **SQL Editor** no menu lateral
5. Copie todo o conteúdo do arquivo `supabase/schema.sql`
6. Cole no editor e clique em **Run**
7. Aguarde a mensagem "Success" — todas as tabelas foram criadas

### 3. Copie as credenciais do Supabase

1. No Supabase, vá em **Settings > API**
2. Copie a **Project URL** e a **anon public key**
3. Na raiz do projeto, copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

4. Abra o `.env` e preencha:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 4. Crie o usuário admin

1. No Supabase, vá em **Authentication > Users**
2. Clique em **Add user**
3. Preencha:
   - Email: `admin@racun.com.br`
   - Password: `Racun@2025`
   - Marque "Auto Confirm User"
4. Clique em **Create User**

### 5. Rode o projeto

```bash
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

Login: `admin@racun.com.br` / `Racun@2025`

---

## DEPLOY NO VERCEL (colocar no ar)

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **New Project**
3. Selecione o repositório `sistema`
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua chave anon
5. Clique em **Deploy**
6. Aguarde ~2 minutos — o sistema vai ao ar em uma URL `.vercel.app`

---

## DEPLOY NA NETLIFY (alternativa)

1. Acesse [netlify.com](https://netlify.com)
2. Clique em **Add new site > Import an existing project**
3. Conecte ao GitHub e selecione o repositório
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Em **Site configuration > Environment variables**, adicione as mesmas variáveis do Vercel
7. Clique em **Deploy site**

---

## ESTRUTURA DO PROJETO

```
racun-hq/
├── src/
│   ├── components/
│   │   ├── layout/         # Sidebar, Layout
│   │   ├── pages/          # Todas as páginas
│   │   └── ui/             # Modal, Badge, StatCard
│   ├── contexts/           # AuthContext
│   ├── lib/                # supabase.ts, utils.ts
│   └── types/              # Tipos TypeScript
├── supabase/
│   └── schema.sql          # SQL para criar o banco
├── .env.example            # Modelo de variáveis de ambiente
└── package.json
```

---

## TECNOLOGIAS

- React 18 + Vite
- TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL)
- Recharts (gráficos)
- React Router DOM
- date-fns (datas)
- lucide-react (ícones)

---

## SUPORTE

Lucas Gustavo Amorim — Agência Racun — Blumenau, SC
CNPJ: 47.717.946/0001-37
