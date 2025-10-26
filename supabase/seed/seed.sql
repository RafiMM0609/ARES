
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
