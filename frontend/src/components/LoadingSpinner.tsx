import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="w-12 h-12 animate-spin text-green-500" />
      <p className="mt-4 text-gray-400">Analyzing watchlists...</p>
    </div>
  );
}
