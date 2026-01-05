/**
 * Database Types for debrief
 * These types mirror the database schema
 */

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  karma: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_name: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge; // For joined queries
}

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  upvotes_count: number;
  downvotes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  current_level: number;
}

export interface Vote {
  id: string;
  idea_id: string;
  user_id: string;
  value: 1 | -1;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface IdeaLevel {
  id: string;
  idea_id: string;
  level_number: number;
  status: "locked" | "in_progress" | "completed";
  data: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface IdeaFeedback {
  id: string;
  idea_id: string;
  level_number: number;
  user_id: string;
  content: string;
  ratings: any; // JSONB
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface IdeaBacker {
  id: string;
  idea_id: string;
  user_id: string;
  pledge_amount: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  user?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface IdeaVersion {
  id: string;
  idea_id: string;
  version_number: number;
  title: string;
  description: string;
  current_level_at_pivot: number;
  pivot_reason: string | null;
  created_at: string;
}

export interface IdeaVersionWithMetadata extends IdeaVersion {
  is_current?: boolean;
}

export interface IdeaCollaborator {
  id: string;
  idea_id: string;
  user_id: string | null;
  email: string;
  role: "viewer" | "editor" | "admin";
  status: "pending" | "accepted" | "declined";
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  invite_token: string | null;
  expires_at: string;
}

export interface IdeaCollaboratorWithDetails extends IdeaCollaborator {
  user?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  inviter?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

// Joined types for API responses
export interface IdeaWithAuthor extends Idea {
  author: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface IdeaWithDetails extends IdeaWithAuthor {
  user_vote: Vote | null;
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      ideas: {
        Row: Idea;
        Insert: Pick<Idea, "user_id" | "title" | "description">;
        Update: Partial<Pick<Idea, "title" | "description">>;
        Relationships: [];
      };
      votes: {
        Row: Vote;
        Insert: Pick<Vote, "idea_id" | "user_id" | "value">;
        Update: Pick<Vote, "value">;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: Pick<Comment, "idea_id" | "user_id" | "content">;
        Update: never;
        Relationships: [];
      };
      idea_levels: {
        Row: IdeaLevel;
        Insert: Pick<IdeaLevel, "idea_id" | "level_number" | "status" | "data">;
        Update: Partial<Pick<IdeaLevel, "status" | "data">>;
        Relationships: [];
      };
      idea_feedback: {
        Row: IdeaFeedback;
        Insert: Pick<IdeaFeedback, "idea_id" | "level_number" | "user_id" | "content" | "ratings"> & { tags?: string[] };
        Update: Partial<Pick<IdeaFeedback, "content" | "ratings" | "tags">>;
        Relationships: [];
      };
      badges: {
        Row: Badge;
        Insert: Pick<Badge, "slug" | "name" | "description" | "icon_name">;
        Update: Partial<Pick<Badge, "name" | "description" | "icon_name">>;
        Relationships: [];
      };
      user_badges: {
        Row: UserBadge;
        Insert: Pick<UserBadge, "user_id" | "badge_id">;
        Update: never;
        Relationships: [];
      };
      idea_backers: {
        Row: IdeaBacker;
        Insert: Pick<IdeaBacker, "idea_id" | "user_id" | "pledge_amount" | "comment" | "is_anonymous">;
        Update: Partial<Pick<IdeaBacker, "pledge_amount" | "comment" | "is_anonymous" | "updated_at">>;
        Relationships: [];
      };
      idea_versions: {
        Row: IdeaVersion;
        Insert: Pick<IdeaVersion, "idea_id" | "title" | "description" | "current_level_at_pivot" | "pivot_reason">;
        Update: never;
        Relationships: [];
      };
      idea_collaborators: {
        Row: IdeaCollaborator;
        Insert: Pick<IdeaCollaborator, "idea_id" | "email" | "role" | "invited_by"> & {
          invite_token?: string;
          expires_at?: string;
        };
        Update: Partial<Pick<IdeaCollaborator, "role" | "status" | "user_id" | "accepted_at" | "declined_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
