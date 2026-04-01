-- Table des templates de la mallette Qualiopi
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL UNIQUE,
  category text NOT NULL,
  critere integer,
  indicateur integer,
  name text NOT NULL,
  file_name text NOT NULL,
  content_markdown text NOT NULL,
  file_type text NOT NULL DEFAULT 'docx',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read templates (shared reference data)
CREATE POLICY "Authenticated users can read templates"
  ON public.templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for fast lookups
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_indicateur ON public.templates(indicateur);
CREATE INDEX idx_templates_template_id ON public.templates(template_id);