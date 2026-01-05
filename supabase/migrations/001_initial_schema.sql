-- =============================================
-- debrief DATABASE SCHEMA
-- Production-grade schema for Idea Poll application
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS PROFILE TABLE
-- Extends Supabase Auth users with profile data
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =============================================
-- IDEAS TABLE
-- Core table for storing user ideas
-- =============================================
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 5000),
    -- Pre-aggregated counters for performance (no COUNT(*) queries)
    upvotes_count INTEGER NOT NULL DEFAULT 0 CHECK (upvotes_count >= 0),
    downvotes_count INTEGER NOT NULL DEFAULT 0 CHECK (downvotes_count >= 0),
    comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON public.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas(user_id);
-- Composite index for cursor-based pagination
CREATE INDEX IF NOT EXISTS idx_ideas_cursor ON public.ideas(created_at DESC, id DESC);

-- =============================================
-- VOTES TABLE
-- Stores user votes on ideas
-- Unique constraint prevents duplicate votes
-- =============================================
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value IN (1, -1)), -- 1 = upvote, -1 = downvote
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- CRITICAL: Ensures one vote per user per idea
    UNIQUE (idea_id, user_id)
);

-- Indexes for vote lookups
CREATE INDEX IF NOT EXISTS idx_votes_idea_id ON public.votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_idea_user ON public.votes(idea_id, user_id);

-- =============================================
-- COMMENTS TABLE
-- Stores user comments on ideas
-- =============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for comment queries
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON public.comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
-- Composite index for cursor-based pagination of comments
CREATE INDEX IF NOT EXISTS idx_comments_cursor ON public.comments(idea_id, created_at DESC, id DESC);

-- =============================================
-- TRIGGER FUNCTIONS
-- Atomic counter updates to prevent race conditions
-- =============================================

-- Function to handle vote changes (INSERT, UPDATE, DELETE)
-- This ensures vote counters are always accurate
CREATE OR REPLACE FUNCTION handle_vote_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- New vote: increment appropriate counter
        IF NEW.value = 1 THEN
            UPDATE public.ideas 
            SET upvotes_count = upvotes_count + 1,
                updated_at = NOW()
            WHERE id = NEW.idea_id;
        ELSE
            UPDATE public.ideas 
            SET downvotes_count = downvotes_count + 1,
                updated_at = NOW()
            WHERE id = NEW.idea_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Vote changed: adjust both counters
        IF OLD.value = 1 AND NEW.value = -1 THEN
            UPDATE public.ideas 
            SET upvotes_count = upvotes_count - 1,
                downvotes_count = downvotes_count + 1,
                updated_at = NOW()
            WHERE id = NEW.idea_id;
        ELSIF OLD.value = -1 AND NEW.value = 1 THEN
            UPDATE public.ideas 
            SET upvotes_count = upvotes_count + 1,
                downvotes_count = downvotes_count - 1,
                updated_at = NOW()
            WHERE id = NEW.idea_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Vote removed: decrement appropriate counter
        IF OLD.value = 1 THEN
            UPDATE public.ideas 
            SET upvotes_count = upvotes_count - 1,
                updated_at = NOW()
            WHERE id = OLD.idea_id;
        ELSE
            UPDATE public.ideas 
            SET downvotes_count = downvotes_count - 1,
                updated_at = NOW()
            WHERE id = OLD.idea_id;
        END IF;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle comment changes
CREATE OR REPLACE FUNCTION handle_comment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.ideas 
        SET comments_count = comments_count + 1,
            updated_at = NOW()
        WHERE id = NEW.idea_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.ideas 
        SET comments_count = comments_count - 1,
            updated_at = NOW()
        WHERE id = OLD.idea_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync profile on user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Vote counter triggers
DROP TRIGGER IF EXISTS on_vote_change ON public.votes;
CREATE TRIGGER on_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON public.votes
    FOR EACH ROW
    EXECUTE FUNCTION handle_vote_change();

-- Comment counter trigger
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_comment_change();

-- Profile sync trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_ideas_updated_at ON public.ideas;
CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON public.ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Minimal, ownership-based policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Anyone can read profiles (for displaying author info)
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- IDEAS POLICIES
-- Anyone can read ideas
CREATE POLICY "Ideas are viewable by everyone"
    ON public.ideas FOR SELECT
    USING (true);

-- Authenticated users can create ideas
CREATE POLICY "Authenticated users can create ideas"
    ON public.ideas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own ideas
CREATE POLICY "Users can update own ideas"
    ON public.ideas FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own ideas
CREATE POLICY "Users can delete own ideas"
    ON public.ideas FOR DELETE
    USING (auth.uid() = user_id);

-- VOTES POLICIES
-- Anyone can read votes (for checking if user voted)
CREATE POLICY "Votes are viewable by everyone"
    ON public.votes FOR SELECT
    USING (true);

-- Authenticated users can create votes
CREATE POLICY "Authenticated users can vote"
    ON public.votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
    ON public.votes FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
    ON public.votes FOR DELETE
    USING (auth.uid() = user_id);

-- COMMENTS POLICIES
-- Anyone can read comments
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT
    USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can comment"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);
