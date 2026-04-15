export type Role = "owner" | "worker";
export type AccountStatus = "active" | "resting" | "archived";
export type CheckinStatus = "planned" | "in_progress" | "done" | "skipped";

export type Profile = {
  id: string;
  email: string;
  role: Role;
};

export type Account = {
  id: string;
  name: string;
  wallet_label: string | null;
  wallet_address: string | null;
  portfolio_url: string | null;
  base_comment: string | null;
  status: AccountStatus;
  assigned_worker_id: string | null;
  created_at: string;
  updated_at: string;
  assigned_worker?: Profile | null;
};

export type DailyRotation = {
  id: string;
  date: string;
  account_id: string;
  is_active: boolean;
  generated_by: string | null;
  created_at: string;
  account?: Account | null;
};

export type DailyCheckin = {
  id: string;
  date: string;
  account_id: string;
  status: CheckinStatus;
  completed_by: string | null;
  completed_at: string | null;
  comment: string | null;
  trades_count_manual: number | null;
  extra_notes: string | null;
  created_at: string;
  updated_at: string;
  account?: Account | null;
  completed_by_profile?: Profile | null;
};

export type AppDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "email" | "role">;
        Update: Partial<Profile>;
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, "id" | "created_at" | "updated_at" | "assigned_worker"> & { id?: string };
        Update: Partial<Omit<Account, "assigned_worker">>;
      };
      daily_rotations: {
        Row: DailyRotation;
        Insert: Omit<DailyRotation, "id" | "created_at" | "account"> & { id?: string };
        Update: Partial<Omit<DailyRotation, "account">>;
      };
      daily_checkins: {
        Row: DailyCheckin;
        Insert: Omit<DailyCheckin, "id" | "created_at" | "updated_at" | "account" | "completed_by_profile"> & { id?: string };
        Update: Partial<Omit<DailyCheckin, "account" | "completed_by_profile">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
