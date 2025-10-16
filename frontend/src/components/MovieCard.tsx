import { Eye, Star, Users } from 'lucide-react';
import type { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const priorityColors: Record<number, string> = {
    1: 'border-green-500',
    2: 'border-green-400',
    3: 'border-yellow-500',
    4: 'border-orange-500',
    5: 'border-red-500',
    6: 'border-gray-600'
  };

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden border-2 ${priorityColors[movie.priority] || 'border-gray-700'} hover:scale-105 transition-transform duration-200`}>
      <a
        href={`https://letterboxd.com/film/${movie.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="aspect-[2/3] bg-gray-900 relative">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              No Poster
            </div>
          )}
        </div>
      </a>
      <div className="p-3 space-y-2">
        <h3 className="text-white font-semibold text-sm line-clamp-2">{movie.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-green-500" />
            <span>{movie.inWatchlistCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-blue-500" />
            <span>{movie.watchedCount}</span>
          </div>
          {movie.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{movie.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
