import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { ClipPrompt, FrontTextWithMedia, EndText, ClipDuration } from '../../api/structs/clip';
import { Button, TextArea, Input } from '../ui';
import Modal from './Modal';

interface EditClipPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: ClipPrompt;
  onSave: () => void;
}

const EditClipPromptModal: React.FC<EditClipPromptModalProps> = ({
  isOpen,
  onClose,
  clip,
  onSave,
}) => {
  // Front Text fields
  const [frontText, setFrontText] = useState('');
  const [frontVid, setFrontVid] = useState('');
  const [pov, setPov] = useState('');

  // End Text field
  const [partTwo, setPartTwo] = useState('');

  // Duration fields
  const [totalDuration, setTotalDuration] = useState('');
  const [frontVidDuration, setFrontVidDuration] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (clip) {
      // Front Text
      setFrontText(clip.front_text?.frontText?.join('\n') || '');
      setFrontVid(clip.front_text?.frontVid || '');
      setPov(clip.front_text?.POV || '');

      // End Text
      setPartTwo(clip.partTwo?.partTwo || '');

      // Duration
      setTotalDuration(clip.totalDuration?.totalDuration || '');
      setFrontVidDuration(clip.totalDuration?.frontVidDuration || '');
    }
  }, [clip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const frontTextData: FrontTextWithMedia = {
        frontText: frontText.split('\n').filter(line => line.trim()),
        frontVid: frontVid,
        POV: pov,
      };

      const endTextData: EndText = {
        partTwo: partTwo,
      };

      const clipDurationData: ClipDuration = {
        totalDuration: totalDuration,
        frontVidDuration: frontVidDuration,
      };

      await API.editClipPrompt(clip.id, frontTextData, endTextData, clipDurationData);
      onSave();
      onClose();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Clip" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Front Text Section */}
        <div className="space-y-3">
          <h4 className="text-white font-medium border-b border-slate-700 pb-2">
            📝 Front Text
          </h4>
          
          <div>
            <label className="block text-sm text-muted mb-1">
              Text Lines (one per line)
            </label>
            <TextArea
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="Enter front text lines..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted mb-1">Front Video</label>
              <Input
                value={frontVid}
                onChange={(e) => setFrontVid(e.target.value)}
                placeholder="Video filename..."
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">POV</label>
              <Input
                value={pov}
                onChange={(e) => setPov(e.target.value)}
                placeholder="POV text..."
              />
            </div>
          </div>
        </div>

        {/* End Text Section */}
        <div className="space-y-3">
          <h4 className="text-white font-medium border-b border-slate-700 pb-2">
            🎬 End Text (Part Two)
          </h4>
          
          <div>
            <label className="block text-sm text-muted mb-1">Part Two Text</label>
            <TextArea
              value={partTwo}
              onChange={(e) => setPartTwo(e.target.value)}
              placeholder="Enter end text..."
              rows={3}
            />
          </div>
        </div>

        {/* Duration Section */}
        <div className="space-y-3">
          <h4 className="text-white font-medium border-b border-slate-700 pb-2">
            ⏱️ Duration
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted mb-1">Total Duration</label>
              <Input
                value={totalDuration}
                onChange={(e) => setTotalDuration(e.target.value)}
                placeholder="e.g., 30s"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Front Video Duration</label>
              <Input
                value={frontVidDuration}
                onChange={(e) => setFrontVidDuration(e.target.value)}
                placeholder="e.g., 5s"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditClipPromptModal;