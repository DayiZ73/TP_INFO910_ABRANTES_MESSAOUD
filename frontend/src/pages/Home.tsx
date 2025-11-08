import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import GroupList from '../components/GroupList';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { getGroups, deleteGroup, getGroupAnalysis } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Group } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; groupId: string | null }>({
    isOpen: false,
    groupId: null
  });

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleView = async (group: Group) => {
    try {
      setLoading(true);
      const analysis = await getGroupAnalysis(group._id);
      navigate('/results', {
        state: {
          analysis,
          groupName: group.name,
          groupId: group._id
        }
      });
    } catch (error: any) {
      console.error('Failed to retrieve analysis:', error);
      const errorMessage = error.response?.data?.message || 'No analysis found. Please use the Refresh button to create a new analysis.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, groupId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.groupId) return;

    try {
      await deleteGroup(deleteConfirm.groupId);
      setGroups(groups.filter(g => g._id !== deleteConfirm.groupId));
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group. Please try again.');
    } finally {
      setDeleteConfirm({ isOpen: false, groupId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, groupId: null });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Movie Harmony Finder
          </h1>
          <p className="text-gray-400">
            Find common movies in your friends' Letterboxd watchlists
          </p>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create New Group
          </button>
          <button
            onClick={fetchGroups}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No groups yet</p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg transition"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <GroupList
            groups={groups}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
