-- ARES Freelancer Platform - Complete Supabase SQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- ============================================
-- USERS TABLE
-- ============================================
-- Extends Supabase auth.users with additional profile info
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    user_type TEXT CHECK (user_type IN ('client', 'freelancer', 'both')) NOT NULL DEFAULT 'freelancer',
    avatar_url TEXT,
    bio TEXT,
    country TEXT,
    timezone TEXT,
    wallet_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ============================================
-- SKILLS TABLE
-- ============================================
CREATE TABLE public.skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are viewable by everyone" 
    ON public.skills FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can create skills" 
    ON public.skills FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- FREELANCER SKILLS (Junction Table)
-- ============================================
CREATE TABLE public.freelancer_skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'intermediate',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(freelancer_id, skill_id)
);

-- RLS Policies for freelancer_skills
ALTER TABLE public.freelancer_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancer skills are viewable by everyone" 
    ON public.freelancer_skills FOR SELECT 
    USING (true);

CREATE POLICY "Freelancers can manage their own skills" 
    ON public.freelancer_skills FOR ALL 
    USING (auth.uid() = freelancer_id);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    budget_amount DECIMAL(12, 2),
    budget_currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('draft', 'open', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
    deadline TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are viewable by involved parties" 
    ON public.projects FOR SELECT 
    USING (
        auth.uid() = client_id OR 
        auth.uid() = freelancer_id OR 
        status IN ('open', 'draft')
    );

CREATE POLICY "Clients can create projects" 
    ON public.projects FOR INSERT 
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own projects" 
    ON public.projects FOR UPDATE 
    USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own projects" 
    ON public.projects FOR DELETE 
    USING (auth.uid() = client_id);

-- ============================================
-- PROJECT MILESTONES TABLE
-- ============================================
CREATE TABLE public.project_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')) DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for project_milestones
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestones viewable by project parties" 
    ON public.project_milestones FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id 
            AND (client_id = auth.uid() OR freelancer_id = auth.uid())
        )
    );

CREATE POLICY "Clients can manage milestones for their projects" 
    ON public.project_milestones FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id AND client_id = auth.uid()
        )
    );

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'overdue')) DEFAULT 'draft',
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    paid_date TIMESTAMPTZ,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoices viewable by involved parties" 
    ON public.invoices FOR SELECT 
    USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can create invoices" 
    ON public.invoices FOR INSERT 
    WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Freelancers can update their own invoices" 
    ON public.invoices FOR UPDATE 
    USING (auth.uid() = freelancer_id AND status = 'draft');

CREATE POLICY "Clients can update invoice status" 
    ON public.invoices FOR UPDATE 
    USING (auth.uid() = client_id);

-- ============================================
-- INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE public.invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoice items viewable with invoice" 
    ON public.invoice_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND (client_id = auth.uid() OR freelancer_id = auth.uid())
        )
    );

CREATE POLICY "Freelancers can manage items on their invoices" 
    ON public.invoice_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id AND freelancer_id = auth.uid()
        )
    );

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    payee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT CHECK (payment_method IN ('wallet', 'bank_transfer', 'crypto', 'card')) DEFAULT 'wallet',
    transaction_hash TEXT, -- For blockchain transactions
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments viewable by involved parties" 
    ON public.payments FOR SELECT 
    USING (auth.uid() = payer_id OR auth.uid() = payee_id);

CREATE POLICY "Payers can create payments" 
    ON public.payments FOR INSERT 
    WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Payers can update their payments" 
    ON public.payments FOR UPDATE 
    USING (auth.uid() = payer_id);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, reviewer_id)
);

-- RLS Policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Users can create reviews for their projects" 
    ON public.reviews FOR INSERT 
    WITH CHECK (
        auth.uid() = reviewer_id AND
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id 
            AND (client_id = auth.uid() OR freelancer_id = auth.uid())
        )
    );

CREATE POLICY "Reviewers can update their own reviews" 
    ON public.reviews FOR UPDATE 
    USING (auth.uid() = reviewer_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'project', 'invoice', 'payment', 'message', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.project_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-' || year_month || '%';
    
    new_number := 'INV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES for Performance
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_user_type ON public.profiles(user_type);

-- Projects indexes
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_freelancer_id ON public.projects(freelancer_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- Invoices indexes
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_freelancer_id ON public.invoices(freelancer_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id);

-- Payments indexes
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_payer_id ON public.payments(payer_id);
CREATE INDEX idx_payments_payee_id ON public.payments(payee_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample skills
INSERT INTO public.skills (name, category) VALUES
    ('JavaScript', 'Programming'),
    ('TypeScript', 'Programming'),
    ('React', 'Framework'),
    ('Next.js', 'Framework'),
    ('Node.js', 'Backend'),
    ('Python', 'Programming'),
    ('UI/UX Design', 'Design'),
    ('Graphic Design', 'Design'),
    ('Content Writing', 'Writing'),
    ('SEO', 'Marketing')
ON CONFLICT (name) DO NOTHING;
