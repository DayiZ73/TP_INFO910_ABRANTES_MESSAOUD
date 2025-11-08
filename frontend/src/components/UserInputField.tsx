import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { validateUser } from '../services/api';

interface UserInputFieldProps {
  users: string[];
  onUsersChange: (users: string[]) => void;
  onValidationChange?: (index: number, validation: { loading: boolean; exists: boolean | null }) => void;
}

interface ValidationState {
  [key: number]: {
    loading: boolean;
    exists: boolean | null;
    displayName?: string;
  };
}

export default function UserInputField({ users, onUsersChange, onValidationChange }: UserInputFieldProps) {
  const [validations, setValidations] = useState<ValidationState>({});

  const addUser = () => {
    onUsersChange([...users, '']);
  };

  const removeUser = (index: number) => {
    const newUsers = users.filter((_, i) => i !== index);
    const newValidations = { ...validations };
    delete newValidations[index];
    setValidations(newValidations);
    onUsersChange(newUsers);
  };

  const updateUser = (index: number, value: string) => {
    const newUsers = [...users];
    newUsers[index] = value;
    onUsersChange(newUsers);
    
    if (value.trim() === '') {
      setValidations(prev => ({
        ...prev,
        [index]: { loading: false, exists: null }
      }));
    }
  };

  const handleValidation = async (index: number, username: string) => {
    if (!username.trim()) return;

    const loadingState = { loading: true, exists: null };
    setValidations(prev => ({
      ...prev,
      [index]: loadingState
    }));
    onValidationChange?.(index, loadingState);

    try {
      const result = await validateUser(username);
      const validationState = {
        loading: false,
        exists: result.exists,
        displayName: result.displayName
      };
      setValidations(prev => ({
        ...prev,
        [index]: validationState
      }));
      onValidationChange?.(index, { loading: false, exists: result.exists });
    } catch (error) {
      const errorState = { loading: false, exists: false };
      setValidations(prev => ({
        ...prev,
        [index]: errorState
      }));
      onValidationChange?.(index, errorState);
    }
  };

  const getInputClass = (index: number) => {
    const validation = validations[index];
    if (!validation || validation.loading) {
      return 'border-gray-700';
    }
    if (validation.exists === true) {
      return 'border-green-500';
    }
    if (validation.exists === false) {
      return 'border-red-500';
    }
    return 'border-gray-700';
  };

  const getValidationIcon = (index: number) => {
    const validation = validations[index];
    if (!validation || !users[index]?.trim()) return null;
    
    if (validation.loading) {
      return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
    if (validation.exists === true) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (validation.exists === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <div key={index} className="space-y-1">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={user}
                onChange={(e) => updateUser(index, e.target.value)}
                onBlur={(e) => handleValidation(index, e.target.value)}
                placeholder="letterboxd_username"
                className={`w-full px-4 py-2 pr-10 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition ${getInputClass(index)}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getValidationIcon(index)}
              </div>
            </div>
            {users.length > 1 && (
              <button
                onClick={() => removeUser(index)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {validations[index]?.displayName && validations[index]?.exists && (
            <p className="text-xs text-green-400 ml-1">
              ✓ {validations[index].displayName}
            </p>
          )}
          {validations[index]?.exists === false && (
            <p className="text-xs text-red-400 ml-1">
              ✗ User not found on Letterboxd
            </p>
          )}
        </div>
      ))}
      <button
        onClick={addUser}
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-green-500 hover:border-green-500 transition"
      >
        + Add User
      </button>
    </div>
  );
}
