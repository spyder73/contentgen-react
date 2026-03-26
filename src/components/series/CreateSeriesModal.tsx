import React, { useState } from 'react';
import Modal from '../modals/Modal';
import { createSeries, Series } from '../../api/series';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (series: Series) => void;
}

const CreateSeriesModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setName('');
    setConcept('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const series = await createSeries({ name: name.trim(), concept: concept.trim() });
      onCreated(series);
      handleClose();
    } catch {
      setError('Failed to create series');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Series" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Name</label>
          <input
            className="input w-full"
            placeholder="e.g. The Midnight Detectives"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Concept</label>
          <textarea
            className="input w-full resize-none"
            rows={3}
            placeholder="What is this series about? Characters, setting, tone..."
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Creating…' : 'Create Series'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSeriesModal;
