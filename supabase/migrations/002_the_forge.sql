-- =============================================
-- THE SCHEMA
-- Infrastructure for the Idea Validation Journey
-- =============================================

-- 1. Add current_level to ideas table
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS current_level INTEGER NOT NULL DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 5);

-- 2. Create idea_levels table
-- Stores the content and status for each level of an idea
CREATE TABLE IF NOT EXISTS public.idea_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL CHECK (level_number >= 1 AND level_number <= 5),
    status TEXT NOT NULL CHECK (status IN ('locked', 'in_progress', 'completed')),
    data JSONB DEFAULT '{}'::jsonb, -- Flexible storage for level-specific fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (idea_id, level_number)
);

-- Index for fetching levels of an idea
CREATE INDEX IF NOT EXISTS idx_idea_levels_idea_id ON public.idea_levels(idea_id);

-- 3. Create idea_feedback table
-- Stores specific feedback for idea levels
CREATE TABLE IF NOT EXISTS public.idea_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL CHECK (level_number >= 1 AND level_number <= 5),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1),
    ratings JSONB DEFAULT '{}'::jsonb, -- Stores {clarity: 5, specificity: 4, etc.}
    tags TEXT[] DEFAULT '{}', -- e.g., ['question', 'risk']
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feedback lookups
CREATE INDEX IF NOT EXISTS idx_idea_feedback_idea_level ON public.idea_feedback(idea_id, level_number);
CREATE INDEX IF NOT EXISTS idx_idea_feedback_user_id ON public.idea_feedback(user_id);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE public.idea_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_feedback ENABLE ROW LEVEL SECURITY;

-- Idea Levels Policies
DROP POLICY IF EXISTS "Idea levels are viewable by everyone" ON public.idea_levels;
CREATE POLICY "Idea levels are viewable by everyone"
    ON public.idea_levels FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert levels for own ideas" ON public.idea_levels;
CREATE POLICY "Users can insert levels for own ideas"
    ON public.idea_levels FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ideas 
            WHERE id = idea_levels.idea_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own idea levels" ON public.idea_levels;
CREATE POLICY "Users can update own idea levels"
    ON public.idea_levels FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.ideas 
            WHERE id = idea_levels.idea_id AND user_id = auth.uid()
        )
    );

-- Idea Feedback Policies
DROP POLICY IF EXISTS "Feedback is viewable by everyone" ON public.idea_feedback;
CREATE POLICY "Feedback is viewable by everyone"
    ON public.idea_feedback FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can create feedback" ON public.idea_feedback;
CREATE POLICY "Authenticated users can create feedback"
    ON public.idea_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own feedback" ON public.idea_feedback;
CREATE POLICY "Users can update own feedback"
    ON public.idea_feedback FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own feedback" ON public.idea_feedback;
CREATE POLICY "Users can delete own feedback"
    ON public.idea_feedback FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Triggers for updated_at
DROP TRIGGER IF EXISTS update_idea_levels_updated_at ON public.idea_levels;
CREATE TRIGGER update_idea_levels_updated_at
    BEFORE UPDATE ON public.idea_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_idea_feedback_updated_at ON public.idea_feedback;
CREATE TRIGGER update_idea_feedback_updated_at
    BEFORE UPDATE ON public.idea_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
