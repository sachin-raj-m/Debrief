-- =============================================
-- PIVOT TREE SCHEMA
-- Version History for Idea Evolution Tracking
-- =============================================

-- 1. Create idea_versions table
-- Stores immutable snapshots of ideas before pivots
CREATE TABLE IF NOT EXISTS public.idea_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    
    -- Snapshot fields
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 5000),
    current_level_at_pivot INTEGER NOT NULL DEFAULT 0 CHECK (current_level_at_pivot >= 0 AND current_level_at_pivot <= 5),
    
    -- Pivot metadata
    pivot_reason TEXT CHECK (char_length(pivot_reason) <= 1000),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE (idea_id, version_number)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_idea_versions_idea_id ON public.idea_versions(idea_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_idea_versions_created_at ON public.idea_versions(created_at DESC);

-- 3. RLS Policies for security

-- Enable RLS
ALTER TABLE public.idea_versions ENABLE ROW LEVEL SECURITY;

-- Version history is viewable by everyone
DROP POLICY IF EXISTS "Version history is viewable by everyone" ON public.idea_versions;
CREATE POLICY "Version history is viewable by everyone"
    ON public.idea_versions FOR SELECT
    USING (true);

-- Users can create versions for own ideas
DROP POLICY IF EXISTS "Users can create versions for own ideas" ON public.idea_versions;
CREATE POLICY "Users can create versions for own ideas"
    ON public.idea_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ideas 
            WHERE id = idea_versions.idea_id AND user_id = auth.uid()
        )
    );

-- 4. Trigger for auto-incrementing version_number
-- Ensures sequential version numbers per idea
CREATE OR REPLACE FUNCTION auto_increment_version_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version_number IS NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1 
        INTO NEW.version_number
        FROM public.idea_versions
        WHERE idea_id = NEW.idea_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_version_number ON public.idea_versions;
CREATE TRIGGER set_version_number
    BEFORE INSERT ON public.idea_versions
    FOR EACH ROW
    EXECUTE FUNCTION auto_increment_version_number();

-- 5. Comments for documentation
COMMENT ON TABLE public.idea_versions IS 'Stores immutable snapshots of ideas before pivots';
COMMENT ON COLUMN public.idea_versions.version_number IS 'Auto-incrementing version number per idea';
COMMENT ON COLUMN public.idea_versions.pivot_reason IS 'Why the founder decided to pivot';
COMMENT ON COLUMN public.idea_versions.current_level_at_pivot IS 'Forge level progress when pivot happened';
