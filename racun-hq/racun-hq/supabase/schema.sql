-- =============================================
-- RACUN HQ — Schema completo do Supabase
-- Cole no SQL Editor do Supabase e execute
-- =============================================

-- Extensão UUID
create extension if not exists "uuid-ossp";

-- ─── PROFILES (usuários da agência) ──────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nome text,
  role text default 'equipe' check (role in ('admin','equipe','cliente')),
  avatar_url text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Perfil visível pelo dono" on profiles for select using (auth.uid() = id);
create policy "Perfil editável pelo dono" on profiles for update using (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao criar usuário
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, nome, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)), 'admin');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── CLIENTES ─────────────────────────────────
create table if not exists clientes (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  empresa text,
  cnpj_cpf text,
  telefone text,
  email text,
  whatsapp text,
  instagram text,
  responsavel_id uuid references profiles(id),
  servicos text[] default '{}',
  valor_mensal numeric(10,2),
  vencimento_dia integer default 10,
  data_inicio date,
  status text default 'ativo' check (status in ('ativo','pausado','encerrado')),
  observacoes text,
  created_at timestamptz default now()
);
alter table clientes enable row level security;
create policy "Clientes acessíveis por usuários autenticados" on clientes for all using (auth.role() = 'authenticated');

-- ─── LEADS / CRM ──────────────────────────────
create table if not exists leads (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  empresa text,
  telefone text,
  email text,
  whatsapp text,
  servico_interesse text,
  valor_estimado numeric(10,2) default 0,
  origem text default 'instagram' check (origem in ('instagram','indicacao','google','site','outros')),
  status text default 'novo' check (status in ('novo','contato','proposta','negociacao','fechado','perdido')),
  responsavel_id uuid references profiles(id),
  observacoes text,
  created_at timestamptz default now()
);
alter table leads enable row level security;
create policy "Leads acessíveis por usuários autenticados" on leads for all using (auth.role() = 'authenticated');

-- ─── ENTREGAS ─────────────────────────────────
create table if not exists entregas (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  descricao text,
  cliente_id uuid references clientes(id) on delete cascade,
  servico text,
  responsavel_id uuid references profiles(id),
  prazo date,
  prioridade text default 'normal' check (prioridade in ('baixa','normal','alta','urgente')),
  status text default 'a_fazer' check (status in ('a_fazer','em_andamento','aguardando_aprovacao','aprovado','concluido','atrasado')),
  link_entrega text,
  observacoes text,
  created_at timestamptz default now()
);
alter table entregas enable row level security;
create policy "Entregas acessíveis por usuários autenticados" on entregas for all using (auth.role() = 'authenticated');

-- ─── TRAFEGO RELATORIOS ───────────────────────
create table if not exists trafego_relatorios (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references clientes(id) on delete cascade,
  mes integer not null,
  ano integer not null,
  plataforma text check (plataforma in ('meta','google','ambos')),
  investimento numeric(10,2) default 0,
  alcance integer default 0,
  impressoes integer default 0,
  cliques integer default 0,
  leads integer default 0,
  conversoes integer default 0,
  roas numeric(5,2) default 0,
  resumo text,
  created_at timestamptz default now()
);
alter table trafego_relatorios enable row level security;
create policy "Relatorios acessíveis por usuários autenticados" on trafego_relatorios for all using (auth.role() = 'authenticated');

-- ─── ENTRADAS FINANCEIRAS ─────────────────────
create table if not exists entradas (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references clientes(id) on delete set null,
  servico text,
  valor numeric(10,2) not null,
  data date not null,
  forma_pagamento text check (forma_pagamento in ('pix','boleto','cartao','transferencia')),
  competencia_mes integer,
  competencia_ano integer,
  status text default 'pago' check (status in ('pago','pendente','atrasado')),
  descricao text,
  recorrente boolean default false,
  created_at timestamptz default now()
);
alter table entradas enable row level security;
create policy "Entradas acessíveis por admin" on entradas for all using (auth.role() = 'authenticated');

-- ─── SAIDAS FINANCEIRAS ───────────────────────
create table if not exists saidas (
  id uuid default uuid_generate_v4() primary key,
  valor numeric(10,2) not null,
  data date not null,
  categoria text check (categoria in ('ferramentas','freelancer','equipamento','imposto','marketing','assinatura','outros')),
  descricao text not null,
  recorrente boolean default false,
  created_at timestamptz default now()
);
alter table saidas enable row level security;
create policy "Saidas acessíveis por admin" on saidas for all using (auth.role() = 'authenticated');

-- ─── EVENTOS / AGENDA ─────────────────────────
create table if not exists eventos (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  tipo text check (tipo in ('reuniao','gravacao','ensaio','casamento','entrega','outros')),
  cliente_id uuid references clientes(id) on delete set null,
  data_inicio timestamptz not null,
  data_fim timestamptz,
  local text,
  responsavel_id uuid references profiles(id),
  observacoes text,
  created_at timestamptz default now()
);
alter table eventos enable row level security;
create policy "Eventos acessíveis por usuários autenticados" on eventos for all using (auth.role() = 'authenticated');

-- ─── CASAMENTOS ───────────────────────────────
create table if not exists casamentos (
  id uuid default uuid_generate_v4() primary key,
  contratante text not null,
  noivos text,
  data_evento date,
  hora_evento time,
  local_cerimonia text,
  local_recepcao text,
  pacote text,
  valor_total numeric(10,2),
  sinal_pago numeric(10,2) default 0,
  status text default 'confirmado' check (status in ('confirmado','em_producao','entregue','arquivado')),
  observacoes text,
  created_at timestamptz default now()
);
alter table casamentos enable row level security;
create policy "Casamentos acessíveis por usuários autenticados" on casamentos for all using (auth.role() = 'authenticated');

-- ─── FORNECEDORES ─────────────────────────────
create table if not exists fornecedores (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  tipo text check (tipo in ('freelancer','grafica','locadora','servico','outros')),
  especialidade text,
  telefone text,
  email text,
  whatsapp text,
  valor_hora numeric(10,2),
  valor_projeto numeric(10,2),
  forma_pagamento text,
  avaliacao integer default 5 check (avaliacao between 1 and 5),
  observacoes text,
  created_at timestamptz default now()
);
alter table fornecedores enable row level security;
create policy "Fornecedores acessíveis por usuários autenticados" on fornecedores for all using (auth.role() = 'authenticated');

-- ─── EQUIPAMENTOS ─────────────────────────────
create table if not exists equipamentos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  categoria text check (categoria in ('camera','lente','audio','iluminacao','acessorio','outros')),
  marca text,
  modelo text,
  numero_serie text,
  status text default 'disponivel' check (status in ('disponivel','em_uso','manutencao','inativo')),
  data_compra date,
  valor_compra numeric(10,2),
  ultima_manutencao date,
  proxima_manutencao date,
  observacoes text,
  created_at timestamptz default now()
);
alter table equipamentos enable row level security;
create policy "Equipamentos acessíveis por usuários autenticados" on equipamentos for all using (auth.role() = 'authenticated');

-- ─── PROPOSTAS ────────────────────────────────
create table if not exists propostas (
  id uuid default uuid_generate_v4() primary key,
  cliente_nome text not null,
  lead_id uuid references leads(id) on delete set null,
  servicos text[] default '{}',
  valor_total numeric(10,2) default 0,
  condicoes_pagamento text,
  validade_dias integer default 15,
  status text default 'rascunho' check (status in ('rascunho','enviada','aceita','recusada')),
  observacoes text,
  created_at timestamptz default now()
);
alter table propostas enable row level security;
create policy "Propostas acessíveis por usuários autenticados" on propostas for all using (auth.role() = 'authenticated');

-- ─── DADOS DE EXEMPLO ─────────────────────────
-- Clientes reais da Racun
insert into clientes (nome, empresa, whatsapp, servicos, valor_mensal, status) values
  ('Prisma Construtora', 'Prisma Construtora Ltda', '(47) 99000-0001', ARRAY['meta_ads','social_media'], 3500, 'ativo'),
  ('Triadx Capital', 'Triadx Capital', '(47) 99000-0002', ARRAY['meta_ads','google_ads'], 2800, 'ativo'),
  ('Braseiro da Vila', 'Braseiro da Vila Restaurante', '(47) 99000-0003', ARRAY['social_media','meta_ads'], 1800, 'ativo'),
  ('Assadão Sabores da Carne', 'Assadão Sabores da Carne', '(47) 99000-0004', ARRAY['social_media'], 1500, 'ativo'),
  ('Kaj Club', 'Kaj Club', '(47) 99000-0005', ARRAY['social_media','audiovisual'], 2200, 'ativo'),
  ('Vitech', 'Vitech Tecnologia', '(47) 99000-0006', ARRAY['social_media','meta_ads'], 2000, 'ativo')
on conflict do nothing;

-- Equipamentos de exemplo
insert into equipamentos (nome, categoria, marca, modelo, status) values
  ('Sony ZV-E10', 'camera', 'Sony', 'ZV-E10', 'disponivel'),
  ('Lente 18-135mm', 'lente', 'Sony', 'E 18-135mm F3.5-5.6 OSS', 'disponivel'),
  ('Ring Light 18"', 'iluminacao', 'Yidoblo', 'A-18III', 'disponivel'),
  ('Microfone Lapela', 'audio', 'Rode', 'Wireless GO II', 'disponivel')
on conflict do nothing;
