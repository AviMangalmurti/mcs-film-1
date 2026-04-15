-- Shared Gallery table
create table public.gallery_items (
  id uuid default gen_random_uuid() primary key,
  uploaded_by uuid references public.profiles on delete set null,
  title text not null default '',
  description text default '',
  image_url text not null,
  category text default 'general',
  is_featured boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.gallery_items enable row level security;

-- Gallery policies
create policy "Gallery items are viewable by everyone"
  on public.gallery_items for select
  using (true);

create policy "Authenticated users can upload to gallery"
  on public.gallery_items for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update own gallery items"
  on public.gallery_items for update
  using (auth.uid() = uploaded_by);

create policy "Users can delete own gallery items"
  on public.gallery_items for delete
  using (auth.uid() = uploaded_by);

create policy "Admins can update any gallery item"
  on public.gallery_items for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can delete any gallery item"
  on public.gallery_items for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Storage bucket for gallery images
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Storage policies for gallery bucket
create policy "Anyone can view gallery images" on storage.objects for select using (bucket_id = 'gallery');
create policy "Authenticated users can upload gallery images" on storage.objects for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');
create policy "Users can update own gallery images" on storage.objects for update using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own gallery images" on storage.objects for delete using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);

NOTIFY pgrst, 'reload schema';
