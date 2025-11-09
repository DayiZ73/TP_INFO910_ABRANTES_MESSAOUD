export interface Movie {
  id: string;
  slug: string;
  title: string;
  posterUrl: string;
  inWatchlistCount: number;
  watchedCount: number;
  users: string[];
  watchedBy?: string[];
  priority: number;
  rating?: string;
  year?: string;
  director?: string;
}

export interface Group {
  _id: string;
  name: string;
  users: string[];
  createdAt: string;
}

export interface AnalysisResult {
  totalMovies: number;
  totalUsers: number;
  movies: Movie[];
}
