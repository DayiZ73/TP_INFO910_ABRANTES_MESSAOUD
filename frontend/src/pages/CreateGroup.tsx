import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import UserInputField from '../components/UserInputField';
import LoadingSpinner from '../components/LoadingSpinner';
import { createGroup, analyzeWatchlists, analyzeGroup } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ValidationState {
  loading: boolean;
  exists: boolean | null;
}

export default function CreateGroup() {
  const navigate = useNavigate();
  const toast = useToast();
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [saveGroup, setSaveGroup] = useState(false);
  const [userValidations, setUserValidations] = useState<{[index: number]: ValidationState}>({});

  const handleValidationChange = (index: number, validation: ValidationState) => {
    setUserValidations(prev => ({
      ...prev,
      [index]: validation
    }));
  };

  const handleAnalyze = async () => {
    const validUsers = users.filter(u => u.trim() !== '');

    if (validUsers.length < 2) {
      toast.error('Please enter at least 2 users');
      return;
    }

    // Check if any validation is in progress
    const validationsInProgress = Object.values(userValidations).some(v => v.loading);
    if (validationsInProgress) {
      toast.warning('Please wait for user validation to complete');
      return;
    }

    // Check if all non-empty users are valid
    const invalidUsers = validUsers.map((_, idx) => {
      const validation = userValidations[idx];
      return validation?.exists === false;
    });

    if (invalidUsers.some(invalid => invalid)) {
      toast.error('All users must exist on Letterboxd. Please fix invalid usernames.');
      return;
    }

    // Check if all users have been validated
    const unvalidatedUsers = validUsers.some((_, idx) => {
      return !userValidations[idx] || userValidations[idx].exists === null;
    });

    if (unvalidatedUsers) {
      toast.warning('Please validate all usernames before analyzing');
      return;
    }

    try {
      setLoading(true);

      let analysis;
      let groupId;

      if (saveGroup) {
        if (!groupName.trim()) {
          toast.error('Please enter a group name');
          setLoading(false);
          return;
        }
        // Create the group and get the returned group with _id
        const createdGroup = await createGroup(groupName, validUsers);
        groupId = createdGroup._id;

        // Analyze the group (this will save the analysis to the analyses collection)
        analysis = await analyzeGroup(groupId);
      } else {
        // Quick analysis without saving group
        analysis = await analyzeWatchlists(validUsers);
      }

      if (!analysis || !analysis.movies) {
        throw new Error('Invalid response from server');
      }

      navigate('/results', {
        state: {
          analysis,
          groupName: saveGroup ? groupName : 'Quick Analysis',
          users: validUsers,
          groupId: groupId // Pass groupId so Results can use it for refresh
        }
      });
    } catch (error: any) {
      console.error('Failed to analyze:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to analyze watchlists. Please check that all usernames are valid and try again.';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Analysis</h1>
          <p className="text-gray-400">
            Enter Letterboxd usernames to find common movies
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="saveGroup"
                  checked={saveGroup}
                  onChange={(e) => setSaveGroup(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700"
                />
                <label htmlFor="saveGroup" className="text-sm text-gray-400">
                  Save as group
                </label>
              </div>

              {saveGroup && (
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name (e.g., Movie Night Friends)"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 mb-4"
                />
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">
                Letterboxd Usernames
              </label>
              <UserInputField
                users={users}
                onUsersChange={setUsers}
                onValidationChange={handleValidationChange}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition"
            >
              {saveGroup ? <Save className="w-5 h-5" /> : null}
              Analyze Watchlists
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
