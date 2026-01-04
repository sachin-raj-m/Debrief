/**
 * Database Types for MuPoll
 * These types mirror the database schema
 */

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
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
      };
      ideas: {
        Row: Idea;
        Insert: Pick<Idea, "user_id" | "title" | "description">;
        Update: Partial<Pick<Idea, "title" | "description">>;
      };
      votes: {
        Row: Vote;
        Insert: Pick<Vote, "idea_id" | "user_id" | "value">;
        Update: Pick<Vote, "value">;
      };
      comments: {
        Row: Comment;
        Insert: Pick<Comment, "idea_id" | "user_id" | "content">;
        Update: never;
      };
      idea_levels: {
        Row: IdeaLevel;
        Insert: Pick<IdeaLevel, "idea_id" | "level_number" | "status" | "data">;
        Update: Partial<Pick<IdeaLevel, "status" | "data">>;
      };
      idea_feedback: {
        Row: IdeaFeedback;
        Insert: Pick<IdeaFeedback, "idea_id" | "level_number" | "user_id" | "content" | "ratings" | "tags">;
        Update: Partial<Pick<IdeaFeedback, "content" | "ratings" | "tags">>;
      };
    };
  };
}
