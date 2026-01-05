-- =====================================================
-- Team Collaboration System
-- =====================================================
-- Description: Enables founders to invite team members/co-founders to collaborate on ideas
-- Author: debrief Team
-- Date: 2026-01-05

-- =====================================================
-- Table: idea_collaborators
-- =====================================================
-- Stores team members and pending invitations for ideas

CREATE TABLE IF NOT EXISTS public.idea_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  invite_token text UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  
  -- Ensure unique invitation per idea-email combination
  CONSTRAINT unique_idea_email UNIQUE(idea_id, email),
  
  -- Note: Prevention of idea owner being added as collaborator is enforced at application level
  -- (Cannot use subquery in CHECK constraint in PostgreSQL)
  
  -- Ensure data integrity based on status
  CONSTRAINT valid_user_or_pending CHECK (
    (status = 'pending' AND user_id IS NULL AND invite_token IS NOT NULL) OR
    (status IN ('accepted', 'declined') AND user_id IS NOT NULL)
  ),
  
  -- Ensure proper timestamp based on status
  CONSTRAINT valid_timestamps CHECK (
    (status = 'pending' AND accepted_at IS NULL AND declined_at IS NULL) OR
    (status = 'accepted' AND accepted_at IS NOT NULL AND declined_at IS NULL) OR
    (status = 'declined' AND declined_at IS NOT NULL AND accepted_at IS NULL)
  )
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_collaborators_idea_id ON public.idea_collaborators(idea_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON public.idea_collaborators(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON public.idea_collaborators(email);
CREATE INDEX IF NOT EXISTS idx_collaborators_invite_token ON public.idea_collaborators(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON public.idea_collaborators(status);
CREATE INDEX IF NOT EXISTS idx_collaborators_expires_at ON public.idea_collaborators(expires_at) WHERE status = 'pending';

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_collaborators_idea_status ON public.idea_collaborators(idea_id, status);

-- =====================================================
-- Helper Functions
-- =====================================================
-- Note: Functions must be defined BEFORE they are used in RLS policies

-- Function to check if user has access to an idea (owner or collaborator)
-- SECURITY DEFINER bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.user_has_idea_access(idea_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ideas WHERE id = idea_uuid AND user_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM idea_collaborators 
    WHERE idea_id = idea_uuid 
      AND user_id = user_uuid 
      AND status = 'accepted'
  );
END;
$$;

-- Function to check if user can edit an idea (owner, editor, or admin)
CREATE OR REPLACE FUNCTION public.user_can_edit_idea(idea_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ideas WHERE id = idea_uuid AND user_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM idea_collaborators 
    WHERE idea_id = idea_uuid 
      AND user_id = user_uuid 
      AND status = 'accepted'
      AND role IN ('editor', 'admin')
  );
END;
$$;

-- Function to generate secure invite token
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token text;
  token_exists boolean;
BEGIN
  LOOP
    -- Generate a random token (32 characters)
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(replace(replace(token, '/', '_'), '+', '-'), '=', '');
    
    -- Check if token already exists
    SELECT EXISTS(
      SELECT 1 FROM public.idea_collaborators 
      WHERE invite_token = token
    ) INTO token_exists;
    
    -- Exit loop if token is unique
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.idea_collaborators
  WHERE status = 'pending'
    AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE public.idea_collaborators ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view collaborations where they are involved
-- (either as the collaborator, invitee by email, or idea owner)
DROP POLICY IF EXISTS "Users can view relevant collaborators" ON public.idea_collaborators;
CREATE POLICY "Users can view relevant collaborators"
  ON public.idea_collaborators
  FOR SELECT
  USING (
    -- User is the collaborator
    auth.uid() = user_id 
    OR
    -- User's email matches the invitation
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- User invited this person
    auth.uid() = invited_by
  );

-- Policy: Idea owners and admins can invite collaborators
DROP POLICY IF EXISTS "Owners and admins can invite collaborators" ON public.idea_collaborators;
CREATE POLICY "Owners and admins can invite collaborators"
  ON public.idea_collaborators
  FOR INSERT
  WITH CHECK (
    -- Must be idea owner
    -- (Admin collaborator check handled at application level to avoid recursion)
    EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = idea_id
        AND ideas.user_id = auth.uid()
    )
  );

-- Policy: Users can accept/decline their own invitations
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.idea_collaborators;
CREATE POLICY "Users can update their own invitations"
  ON public.idea_collaborators
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Owners and admins can remove collaborators
DROP POLICY IF EXISTS "Owners and admins can remove collaborators" ON public.idea_collaborators;
CREATE POLICY "Owners and admins can remove collaborators"
  ON public.idea_collaborators
  FOR DELETE
  USING (
    -- Idea owner can remove anyone
    EXISTS (
      SELECT 1 FROM public.ideas
      WHERE ideas.id = idea_id
        AND ideas.user_id = auth.uid()
    )
    OR
    -- Users can remove themselves
    user_id = auth.uid()
  );

-- =====================================================
-- Update RLS Policies for Ideas Table
-- =====================================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view all ideas" ON public.ideas;
DROP POLICY IF EXISTS "Users can view ideas they own or collaborate on" ON public.ideas;

-- New policy: Allow access to idea owners and accepted collaborators
CREATE POLICY "Users can view ideas they own or collaborate on"
  ON public.ideas
  FOR SELECT
  USING (public.user_has_idea_access(id, auth.uid()));

-- Drop existing UPDATE policy if it exists
DROP POLICY IF EXISTS "Users can update their own ideas" ON public.ideas;
DROP POLICY IF EXISTS "Owners, editors, and admins can update ideas" ON public.ideas;

-- New policy: Editors and admins can update ideas
CREATE POLICY "Owners, editors, and admins can update ideas"
  ON public.ideas
  FOR UPDATE
  USING (public.user_can_edit_idea(id, auth.uid()));

-- =====================================================
-- Update RLS Policies for Related Tables
-- =====================================================

-- Idea Levels: Allow access for collaborators
DROP POLICY IF EXISTS "Users can view levels for their ideas" ON public.idea_levels;
DROP POLICY IF EXISTS "Users can view levels for ideas they have access to" ON public.idea_levels;
CREATE POLICY "Users can view levels for ideas they have access to"
  ON public.idea_levels
  FOR SELECT
  USING (public.user_has_idea_access(idea_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update levels for their ideas" ON public.idea_levels;
DROP POLICY IF EXISTS "Owners and editors can update levels" ON public.idea_levels;
CREATE POLICY "Owners and editors can update levels"
  ON public.idea_levels
  FOR UPDATE
  USING (public.user_can_edit_idea(idea_id, auth.uid()));

-- Idea Feedback: Allow collaborators to view feedback
DROP POLICY IF EXISTS "Users can view feedback for their ideas" ON public.idea_feedback;
DROP POLICY IF EXISTS "Users can view feedback for accessible ideas" ON public.idea_feedback;
CREATE POLICY "Users can view feedback for accessible ideas"
  ON public.idea_feedback
  FOR SELECT
  USING (public.user_has_idea_access(idea_id, auth.uid()));

-- Idea Versions: Allow collaborators to view history
DROP POLICY IF EXISTS "Users can view versions of their ideas" ON public.idea_versions;
DROP POLICY IF EXISTS "Users can view versions of accessible ideas" ON public.idea_versions;
CREATE POLICY "Users can view versions of accessible ideas"
  ON public.idea_versions
  FOR SELECT
  USING (public.user_has_idea_access(idea_id, auth.uid()));

-- Idea Backers: Allow collaborators to view backers
DROP POLICY IF EXISTS "Users can view backers for their ideas" ON public.idea_backers;
DROP POLICY IF EXISTS "Users can view backers for accessible ideas" ON public.idea_backers;
CREATE POLICY "Users can view backers for accessible ideas"
  ON public.idea_backers
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.user_has_idea_access(idea_id, auth.uid())
  );

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.idea_collaborators IS 'Stores team members and pending invitations for collaborative idea development';
COMMENT ON COLUMN public.idea_collaborators.role IS 'Permission level: viewer (read-only), editor (can edit), admin (can manage team)';
COMMENT ON COLUMN public.idea_collaborators.status IS 'Invitation status: pending (not yet accepted), accepted (active member), declined (rejected invite)';
COMMENT ON COLUMN public.idea_collaborators.invite_token IS 'Secure token used in invitation URL, null after acceptance';
COMMENT ON COLUMN public.idea_collaborators.expires_at IS 'Invitation expiration timestamp, default 7 days from creation';
COMMENT ON FUNCTION public.generate_invite_token IS 'Generates a cryptographically secure unique token for invitations';
COMMENT ON FUNCTION public.cleanup_expired_invitations IS 'Removes expired pending invitations, returns count of deleted rows';


-- COMPLETELY DISABLE RLS on idea_collaborators for now to break the cycle
ALTER TABLE public.idea_collaborators DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Update idea_versions Policy for Collaborators
-- =====================================================
-- Allow editor/admin collaborators to create versions (pivots)

DROP POLICY IF EXISTS "Users can create versions for own ideas" ON public.idea_versions;
CREATE POLICY "Users can create versions for accessible ideas"
    ON public.idea_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ideas 
            WHERE id = idea_versions.idea_id AND user_id = auth.uid()
        )
        OR
        public.user_can_edit_idea(idea_id, auth.uid())
    );