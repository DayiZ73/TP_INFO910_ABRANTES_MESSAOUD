import { Film, Users } from 'lucide-react';

interface StatsBarProps {
  totalMovies: number;
  totalUsers: number;
}

export default function StatsBar({ totalMovies, totalUsers }: StatsBarProps) {
  return (
    <div className="flex gap-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
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
  );
}
