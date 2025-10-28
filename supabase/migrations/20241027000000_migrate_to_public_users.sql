-- Migration: Move from auth.users to public.users with manual authentication
-- This migration creates a standalone user management system

-- ============================================
-- CREATE PUBLIC.USERS TABLE
-- ============================================
CREATE TABLE public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- bcrypt hashed password
    full_name TEXT,
    user_type TEXT CHECK (user_type IN ('client', 'freelancer', 'both')) NOT NULL DEFAULT 'freelancer',
    avatar_url TEXT,
    bio TEXT,
    country TEXT,
    timezone TEXT,
    wallet_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE SESSIONS TABLE FOR JWT MANAGEMENT
-- ============================================
CREATE TABLE public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL, -- hashed session token
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_user_type ON public.users(user_type);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- ============================================
-- DROP OLD TRIGGERS THAT REFERENCE AUTH.USERS
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- DROP OLD PROFILES TABLE
-- ============================================
-- First, we need to drop all dependent tables' foreign keys
ALTER TABLE public.freelancer_skills DROP CONSTRAINT IF EXISTS freelancer_skills_freelancer_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_freelancer_id_fkey;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_freelancer_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payer_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payee_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewee_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Drop the profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- RECREATE FOREIGN KEY CONSTRAINTS
-- ============================================
ALTER TABLE public.freelancer_skills 
    ADD CONSTRAINT freelancer_skills_freelancer_id_fkey 
    FOREIGN KEY (freelancer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.projects 
    ADD CONSTRAINT projects_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.projects 
    ADD CONSTRAINT projects_freelancer_id_fkey 
    FOREIGN KEY (freelancer_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_client_id_fkey 
    FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_freelancer_id_fkey 
    FOREIGN KEY (freelancer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.payments 
    ADD CONSTRAINT payments_payer_id_fkey 
    FOREIGN KEY (payer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.payments 
    ADD CONSTRAINT payments_payee_id_fkey 
    FOREIGN KEY (payee_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
    ADD CONSTRAINT reviews_reviewer_id_fkey 
    FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
    ADD CONSTRAINT reviews_reviewee_id_fkey 
    FOREIGN KEY (reviewee_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================
-- UPDATE RLS POLICIES TO USE SESSION-BASED AUTH
-- ============================================
-- Note: RLS policies will need to be updated to check against 
-- current_setting('app.current_user_id') instead of auth.uid()

-- Users table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone" 
    ON public.users FOR SELECT 
    USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE 
    USING (id::text = current_setting('app.current_user_id', true));

-- Skills table RLS (keep existing)
-- Already has proper RLS, no auth.uid() dependency

-- Freelancer Skills RLS
DROP POLICY IF EXISTS "Freelancer skills are viewable by everyone" ON public.freelancer_skills;
DROP POLICY IF EXISTS "Freelancers can manage their own skills" ON public.freelancer_skills;

CREATE POLICY "Freelancer skills are viewable by everyone" 
    ON public.freelancer_skills FOR SELECT 
    USING (true);

CREATE POLICY "Freelancers can manage their own skills" 
    ON public.freelancer_skills FOR ALL 
    USING (freelancer_id::text = current_setting('app.current_user_id', true));

-- Projects RLS
DROP POLICY IF EXISTS "Projects are viewable by involved parties" ON public.projects;
DROP POLICY IF EXISTS "Clients can create projects" ON public.projects;
DROP POLICY IF EXISTS "Clients can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Clients can delete their own projects" ON public.projects;

CREATE POLICY "Projects are viewable by involved parties" 
    ON public.projects FOR SELECT 
    USING (
        client_id::text = current_setting('app.current_user_id', true) OR 
        freelancer_id::text = current_setting('app.current_user_id', true) OR 
        status IN ('open', 'draft')
    );

CREATE POLICY "Clients can create projects" 
    ON public.projects FOR INSERT 
    WITH CHECK (client_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Clients can update their own projects" 
    ON public.projects FOR UPDATE 
    USING (client_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Clients can delete their own projects" 
    ON public.projects FOR DELETE 
    USING (client_id::text = current_setting('app.current_user_id', true));

-- Project Milestones RLS
DROP POLICY IF EXISTS "Milestones viewable by project parties" ON public.project_milestones;
DROP POLICY IF EXISTS "Clients can manage milestones for their projects" ON public.project_milestones;

CREATE POLICY "Milestones viewable by project parties" 
    ON public.project_milestones FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id 
            AND (client_id::text = current_setting('app.current_user_id', true) 
                 OR freelancer_id::text = current_setting('app.current_user_id', true))
        )
    );

CREATE POLICY "Clients can manage milestones for their projects" 
    ON public.project_milestones FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id 
            AND client_id::text = current_setting('app.current_user_id', true)
        )
    );

-- Invoices RLS
DROP POLICY IF EXISTS "Invoices viewable by involved parties" ON public.invoices;
DROP POLICY IF EXISTS "Freelancers can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Freelancers can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Clients can update invoice status" ON public.invoices;

CREATE POLICY "Invoices viewable by involved parties" 
    ON public.invoices FOR SELECT 
    USING (
        client_id::text = current_setting('app.current_user_id', true) OR 
        freelancer_id::text = current_setting('app.current_user_id', true)
    );

CREATE POLICY "Freelancers can create invoices" 
    ON public.invoices FOR INSERT 
    WITH CHECK (freelancer_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Freelancers can update their own invoices" 
    ON public.invoices FOR UPDATE 
    USING (
        freelancer_id::text = current_setting('app.current_user_id', true) AND 
        status = 'draft'
    );

CREATE POLICY "Clients can update invoice status" 
    ON public.invoices FOR UPDATE 
    USING (client_id::text = current_setting('app.current_user_id', true));

-- Invoice Items RLS
DROP POLICY IF EXISTS "Invoice items viewable with invoice" ON public.invoice_items;
DROP POLICY IF EXISTS "Freelancers can manage items on their invoices" ON public.invoice_items;

CREATE POLICY "Invoice items viewable with invoice" 
    ON public.invoice_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND (client_id::text = current_setting('app.current_user_id', true) 
                 OR freelancer_id::text = current_setting('app.current_user_id', true))
        )
    );

CREATE POLICY "Freelancers can manage items on their invoices" 
    ON public.invoice_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND freelancer_id::text = current_setting('app.current_user_id', true)
        )
    );

-- Payments RLS
DROP POLICY IF EXISTS "Payments viewable by involved parties" ON public.payments;
DROP POLICY IF EXISTS "Payers can create payments" ON public.payments;
DROP POLICY IF EXISTS "Payers can update their payments" ON public.payments;

CREATE POLICY "Payments viewable by involved parties" 
    ON public.payments FOR SELECT 
    USING (
        payer_id::text = current_setting('app.current_user_id', true) OR 
        payee_id::text = current_setting('app.current_user_id', true)
    );

CREATE POLICY "Payers can create payments" 
    ON public.payments FOR INSERT 
    WITH CHECK (payer_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Payers can update their payments" 
    ON public.payments FOR UPDATE 
    USING (payer_id::text = current_setting('app.current_user_id', true));

-- Reviews RLS
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews for their projects" ON public.reviews;
DROP POLICY IF EXISTS "Reviewers can update their own reviews" ON public.reviews;

CREATE POLICY "Reviews are viewable by everyone" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Users can create reviews for their projects" 
    ON public.reviews FOR INSERT 
    WITH CHECK (
        reviewer_id::text = current_setting('app.current_user_id', true) AND
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_id 
            AND (client_id::text = current_setting('app.current_user_id', true) 
                 OR freelancer_id::text = current_setting('app.current_user_id', true))
        )
    );

CREATE POLICY "Reviewers can update their own reviews" 
    ON public.reviews FOR UPDATE 
    USING (reviewer_id::text = current_setting('app.current_user_id', true));

-- Notifications RLS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (user_id::text = current_setting('app.current_user_id', true));

-- User Sessions RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" 
    ON public.user_sessions FOR SELECT 
    USING (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own sessions" 
    ON public.user_sessions FOR DELETE 
    USING (user_id::text = current_setting('app.current_user_id', true));

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO CLEAN UP EXPIRED SESSIONS
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION TO SET USER CONTEXT FOR RLS
-- ============================================
-- This function allows setting the current user ID for RLS policies
-- to use via current_setting('app.current_user_id')
CREATE OR REPLACE FUNCTION set_config(
    setting_name text,
    setting_value text,
    is_local boolean DEFAULT false
)
RETURNS text AS $$
BEGIN
    PERFORM set_config(setting_name, setting_value, is_local);
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: In production, schedule cleanup_expired_sessions to run periodically
-- You can use pg_cron extension or call it from your application
