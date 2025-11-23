
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS image_path text;

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS allow_select_owner ON public.entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS allow_insert_owner ON public.entries
  FOR INSERT
  WITH CHECK (auth.uid() = NEW.user_id);

CREATE POLICY IF NOT EXISTS allow_update_owner ON public.entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = NEW.user_id);

CREATE POLICY IF NOT EXISTS allow_delete_owner ON public.entries
  FOR DELETE
  USING (auth.uid() = user_id);
