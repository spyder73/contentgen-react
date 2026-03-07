import React, { useState } from 'react';
import { parseUserID } from '../../api/api';
import Modal from './Modal';
import { Button, Input } from '../ui';

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add User" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-xs uppercase tracking-wide mb-1">Telegram Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
          />
        </div>

        <div>
          <label className="block text-slate-300 text-xs uppercase tracking-wide mb-1">Telegram User ID</label>
          <Input
            value={userIDInput}
            onChange={(e) => setUserIDInput(e.target.value)}
            placeholder="123456789 or 1.2.3.4.5.6.7.8.9"
          />
          <p className="text-slate-500 text-xs mt-1">Dots are removed automatically.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Add User
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
