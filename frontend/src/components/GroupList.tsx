import { Trash2, Play } from 'lucide-react';
import type { Group } from '../types';

interface GroupListProps {
  groups: Group[];
  onAnalyze: (group: Group) => void;
  onDelete: (id: string) => void;
}

export default function GroupList({ groups, onAnalyze, onDelete }: GroupListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <div
          key={group._id}
          className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-green-500 transition"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-white font-semibold">{group.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => onDelete(group._id)}
              className="text-gray-500 hover:text-red-500 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="mb-3">
            <p className="text-sm text-gray-400 mb-1">Users:</p>
            <div className="flex flex-wrap gap-1">
              {group.users.map((user, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-900 text-xs text-gray-300 rounded"
                >
                  {user}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => onAnalyze(group)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
          >
            <Play className="w-4 h-4" />
            Analyze
          </button>
        </div>
      ))}
    </div>
  );
}
