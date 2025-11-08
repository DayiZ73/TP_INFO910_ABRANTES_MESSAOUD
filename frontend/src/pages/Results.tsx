import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid3x3, List, RefreshCw } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import MovieList from '../components/MovieList';
import StatsBar from '../components/StatsBar';
import { analyzeGroup, analyzeWatchlists } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { AnalysisResult } from '../types';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const stateData = location.state as {
    analysis: AnalysisResult;
    groupName: string;
    groupId?: string;
    users?: string[];
  };

  const [analysis, setAnalysis] = useState<AnalysisResult>(stateData?.analysis);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!stateData?.analysis) {
    navigate('/');
    return null;
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      let freshAnalysis: AnalysisResult;

      if (stateData.groupId) {
        // If from saved group, use analyzeGroup
        freshAnalysis = await analyzeGroup(stateData.groupId, true);
      } else if (stateData.users) {
        // If from quick analysis, use analyzeWatchlists
        freshAnalysis = await analyzeWatchlists(stateData.users, true);
      } else {
        throw new Error('No group ID or users data available for refresh');
      }

      setAnalysis(freshAnalysis);
      toast.success('Analysis refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
      toast.error('Failed to refresh. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!analysis) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">{stateData.groupName}</h1>
          <p className="text-gray-400">Analysis Results</p>
        </div>

        <div className="mb-6">
          <StatsBar totalMovies={analysis.totalMovies} totalUsers={analysis.totalUsers} />
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              isRefreshing
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {analysis.movies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No common movies found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {analysis.movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <MovieList movies={analysis.movies} />
        )}
      </div>
    </div>
  );
}
