-- Create guild_banks table to store bank configurations
create table if not exists public.guild_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  share_code text unique not null,
  gold integer not null default 0,
  silver integer not null default 0,
  copper integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create bank_items table to store individual items in slots
create table if not exists public.bank_items (
  id uuid primary key default gen_random_uuid(),
  guild_bank_id uuid not null references public.guild_banks(id) on delete cascade,
  slot_number integer not null check (slot_number >= 0 and slot_number < 28),
  item_id integer not null,
  quantity integer not null default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(guild_bank_id, slot_number)
);

-- Enable RLS
alter table public.guild_banks enable row level security;
alter table public.bank_items enable row level security;

-- Public read access for guild banks (anyone with share code can view)
create policy "guild_banks_select_all"
  on public.guild_banks for select
  using (true);

-- Public read access for bank items
create policy "bank_items_select_all"
  on public.bank_items for select
  using (true);

-- Public insert/update/delete for now (we'll add password protection later)
create policy "guild_banks_insert_all"
  on public.guild_banks for insert
  with check (true);

create policy "guild_banks_update_all"
  on public.guild_banks for update
  using (true);

create policy "guild_banks_delete_all"
  on public.guild_banks for delete
  using (true);

create policy "bank_items_insert_all"
  on public.bank_items for insert
  with check (true);

create policy "bank_items_update_all"
  on public.bank_items for update
  using (true);

create policy "bank_items_delete_all"
  on public.bank_items for delete
  using (true);

-- Create index for faster lookups
create index if not exists idx_bank_items_guild_bank_id on public.bank_items(guild_bank_id);
create index if not exists idx_guild_banks_share_code on public.guild_banks(share_code);
