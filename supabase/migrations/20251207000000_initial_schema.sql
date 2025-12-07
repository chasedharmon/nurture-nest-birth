-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE lead_source AS ENUM ('contact_form', 'newsletter', 'manual');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'scheduled', 'client', 'lost');
CREATE TYPE activity_type AS ENUM ('note', 'email_sent', 'call', 'meeting', 'status_change');
CREATE TYPE user_role AS ENUM ('admin', 'viewer');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role user_role NOT NULL DEFAULT 'admin'
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source lead_source NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',

  -- Contact information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  due_date DATE,
  service_interest TEXT,
  message TEXT,

  -- Metadata
  email_domain TEXT,
  assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create lead_activities table
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  activity_type activity_type NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to_user_id);
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on leads table
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to extract email domain
CREATE OR REPLACE FUNCTION extract_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_domain = SUBSTRING(NEW.email FROM '@(.+)$');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-extract email domain on leads table
CREATE TRIGGER extract_leads_email_domain
  BEFORE INSERT OR UPDATE OF email ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION extract_email_domain();

-- Create function to log status changes automatically
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_activities (lead_id, activity_type, content, metadata)
    VALUES (
      NEW.id,
      'status_change',
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-log status changes
CREATE TRIGGER log_lead_status_change
  AFTER UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own data
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for leads table
-- Authenticated users (admins) can view all leads
CREATE POLICY "Authenticated users can view all leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users (admins) can insert leads
CREATE POLICY "Authenticated users can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users (admins) can update leads
CREATE POLICY "Authenticated users can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (true);

-- Authenticated users (admins) can delete leads
CREATE POLICY "Authenticated users can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for lead_activities table
-- Authenticated users can view all activities
CREATE POLICY "Authenticated users can view all activities"
  ON public.lead_activities FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert activities
CREATE POLICY "Authenticated users can insert activities"
  ON public.lead_activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update their own activities
CREATE POLICY "Users can update own activities"
  ON public.lead_activities FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- Authenticated users can delete their own activities
CREATE POLICY "Users can delete own activities"
  ON public.lead_activities FOR DELETE
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
