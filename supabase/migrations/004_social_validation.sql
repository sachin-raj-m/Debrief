-- =============================================
-- SOCIAL VALIDATION ("Backing")
-- =============================================

-- 1. Create idea_backers table
CREATE TABLE IF NOT EXISTS public.idea_backers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pledge_amount INTEGER DEFAULT 0, -- Amount in display currency (e.g. USD)
    comment TEXT CHECK (char_length(comment) <= 500),
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (idea_id, user_id) -- One backing per user per idea
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_idea_backers_idea_id ON public.idea_backers(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_backers_user_id ON public.idea_backers(user_id);

-- 3. RLS Policies
ALTER TABLE public.idea_backers ENABLE ROW LEVEL SECURITY;

-- Everyone can view backers (unless we add logic to hide anonymous names later in API)
DROP POLICY IF EXISTS "Backers are viewable by everyone" ON public.idea_backers;
CREATE POLICY "Backers are viewable by everyone"
    ON public.idea_backers FOR SELECT
    USING (true);

-- Authenticated users can back ideas
DROP POLICY IF EXISTS "Users can back ideas" ON public.idea_backers;
CREATE POLICY "Users can back ideas"
    ON public.idea_backers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own backing
DROP POLICY IF EXISTS "Users can update own backing" ON public.idea_backers;
CREATE POLICY "Users can update own backing"
    ON public.idea_backers FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own backing
DROP POLICY IF EXISTS "Users can delete own backing" ON public.idea_backers;
CREATE POLICY "Users can delete own backing"
    ON public.idea_backers FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Triggers
DROP TRIGGER IF EXISTS update_idea_backers_updated_at ON public.idea_backers;
CREATE TRIGGER update_idea_backers_updated_at
    BEFORE UPDATE ON public.idea_backers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
