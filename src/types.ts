import type { Theme } from "./config";
import type { MonthlyActivity } from "./utils/activity";

/** Subset of the Qiita "user" API response that this worker consumes. */
export interface QiitaUser {
  id: string;
  name: string | null;
  profile_image_url: string;
  followers_count: number;
}

/** Subset of a Qiita "item" (article) API response. */
export interface QiitaItem {
  likes_count: number;
  stocks_count: number;
  created_at: string;
}

/** Fully-resolved data needed to render the profile card SVG. */
export interface ProfileStats {
  username: string;
  userId: string;
  icon: string;
  posts: number;
  likes: number;
  stocks: number;
  followers: number;
  theme: Theme;
  activity: MonthlyActivity[];
}
