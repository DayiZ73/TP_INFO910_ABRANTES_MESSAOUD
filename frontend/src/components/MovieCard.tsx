import { useState } from 'react';
import { Eye, Star, Users, Info } from 'lucide-react';
import type { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  const handleInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowInfo(!showInfo);
  };

  const priorityColors: Record<number, string> = {
    1: 'border-green-500',
    2: 'border-green-400',
    3: 'border-yellow-500',
    4: 'border-orange-500',
    5: 'border-red-500',
    6: 'border-gray-600'
  };

  const watchlistUsers = movie.users || [];
  const watchedUsers = movie.watchedBy || [];

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
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-sm line-clamp-2 flex-1">{movie.title}</h3>
          <button
            onClick={handleInfoClick}
            className={`p-1 rounded transition cursor-pointer ${
              showInfo ? 'bg-gray-600 text-white' : 'hover:bg-gray-700 text-gray-400 hover:text-white'
            }`}
            title="Voir les détails"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className="bg-gray-900 border border-gray-700 rounded p-2 space-y-2 text-xs">
            {/* Watchlist Users */}
            {watchlistUsers.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-green-400 font-medium mb-1">
                  <Users className="w-3 h-3" />
                  <span>Watchlist ({watchlistUsers.length})</span>
                </div>
                <div className="text-gray-300 pl-4">
                  {watchlistUsers.join(', ')}
                </div>
              </div>
            )}

            {/* Watched Users */}
            {(watchedUsers.length > 0 || movie.watchedCount > 0) && (
              <div>
                <div className="flex items-center gap-1 text-blue-400 font-medium mb-1">
                  <Eye className="w-3 h-3" />
                  <span>Déjà vu ({movie.watchedCount})</span>
                </div>
                <div className="text-gray-300 pl-4">
                  {watchedUsers.length > 0
                    ? watchedUsers.join(', ')
                    : movie.watchedCount > 0
                    ? `${movie.watchedCount} personne(s) - Rafraîchissez l'analyse pour voir les noms`
                    : 'Personne'}
                </div>
              </div>
            )}

            {/* No data message */}
            {watchlistUsers.length === 0 && movie.watchedCount === 0 && (
              <div className="text-gray-500 text-center">
                Aucune donnée utilisateur
              </div>
            )}
          </div>
        )}

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