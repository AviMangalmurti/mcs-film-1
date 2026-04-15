-- Add missing columns to portfolio_items table (CRITICAL FIX)
-- These columns are used by the portfolio page but were missing from the schema

-- Add category column for filtering (Film, Photography, BTS, etc.)
alter table public.portfolio_items
  add column if not exists category text default '';

-- Add section_id for page builder feature (assigns items to custom sections)
alter table public.portfolio_items
  add column if not exists section_id uuid references public.profile_sections on delete set null;

-- Add grid_size for layout customization (small, medium, large)
alter table public.portfolio_items
  add column if not exists grid_size text default 'medium';

-- Add show_info for display preferences (hover, always, never)
alter table public.portfolio_items
  add column if not exists show_info text default 'hover';

NOTIFY pgrst, 'reload schema';
