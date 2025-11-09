import { Film, Users } from 'lucide-react';

interface StatsBarProps {
  totalMovies: number;
  totalUsers: number;
  users?: string[];
}

export default function StatsBar({ totalMovies, totalUsers, users }: StatsBarProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-green-500" />
          <span className="text-white font-medium">{totalMovies}</span>
          <span className="text-gray-400 text-sm">common movies</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="text-white font-medium">{totalUsers}</span>
          <span className="text-gray-400 text-sm">users</span>
        </div>
      </div>

      {users && users.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {users.map(user => (
              <a
                key={user}
                href={`https://letterboxd.com/${user}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-full text-sm transition"
              >
                @{user}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
