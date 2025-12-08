import React, { useState } from 'react';
import { parseUserID } from '../../api/api';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string, userID: number) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [username, setUsername] = useState('');
  const [userIDInput, setUserIDInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !userIDInput.trim()) return;

    const userID = parseUserID(userIDInput);
    if (isNaN(userID)) {
      alert('Invalid User ID');
      return;
    }

    onSubmit(username.trim(), userID);
    setUsername('');
    setUserIDInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Add User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Telegram Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              className="w-full px-3 py-2 bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1">Telegram User ID</label>
            <input
              type="text"
              value={userIDInput}
              onChange={(e) => setUserIDInput(e.target.value)}
              placeholder="123456789 or 1.2.3.4.5.6.7.8.9"
              className="w-full px-3 py-2 bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-slate-500 text-xs mt-1">Dots will be removed automatically</p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;