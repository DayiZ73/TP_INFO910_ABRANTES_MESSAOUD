import { Eye, Star, Users, ExternalLink } from 'lucide-react';
import type { Movie } from '../types';

interface MovieListProps {
  movies: Movie[];
}

export default function MovieList({ movies }: MovieListProps) {
  const priorityLabels: Record<number, string> = {
    1: 'All users, unwatched',
    2: 'Most users, unwatched',
    3: 'Some users, unwatched',
    4: 'All users, partially watched',
    5: 'Most users, partially watched',
    6: 'Other'
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-800 border-b border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              <Users className="w-4 h-4 inline" />
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              <Eye className="w-4 h-4 inline" />
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              <Star className="w-4 h-4 inline" />
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              Link
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {movies.map((movie) => (
            <tr key={movie.id} className="hover:bg-gray-800/50 transition">
              <td className="px-4 py-3 text-sm text-white">
                <div className="font-medium">{movie.title}</div>
                {movie.year && <div className="text-xs text-gray-500">{movie.year}</div>}
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {priorityLabels[movie.priority]}
              </td>
              <td className="px-4 py-3 text-sm text-center text-green-500">
                {movie.inWatchlistCount}
              </td>
              <td className="px-4 py-3 text-sm text-center text-blue-500">
                {movie.watchedCount}
              </td>
              <td className="px-4 py-3 text-sm text-center text-yellow-500">
                {movie.rating || '-'}
              </td>
              <td className="px-4 py-3 text-center">
                <a
                  href={`https://letterboxd.com/film/${movie.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400 transition"
                >
                  <ExternalLink className="w-4 h-4 inline" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
