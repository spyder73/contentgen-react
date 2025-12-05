import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import API, { VideoPrompt, FrontTextWithMedia, EndText, VidDuration } from '../../api/api';

interface EditVideoPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoPrompt: VideoPrompt;
  onSubmit: (frontText: FrontTextWithMedia, endText: EndText, vidDuration: VidDuration) => void;
}

const EditVideoPromptModal: React.FC<EditVideoPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  videoPrompt,
  onSubmit 
}) => {
  const [frontText, setFrontText] = useState(videoPrompt.front_text?.frontText.join('\n') || '');
  const [mediaUrl, setMediaUrl] = useState(videoPrompt.front_text?.frontVid || '');
  const [pov, setPov] = useState(videoPrompt.front_text?.POV || '');
  const [endText, setEndText] = useState(videoPrompt.partTwo?.partTwo || '');
  const [totalDuration, setTotalDuration] = useState(videoPrompt.totalDuration?.totalDuration || '');
  const [frontVidDuration, setFrontVidDuration] = useState(videoPrompt.totalDuration?.frontVidDuration || '');
  const [availableMedia, setAvailableMedia] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      API.getAvailableMedia().then(setAvailableMedia).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const frontTextObj: FrontTextWithMedia = {
      frontText: frontText.split('\n').filter(line => line.trim()),
      frontVid: mediaUrl,
      POV: pov
    };

    const endTextObj: EndText = {
      partTwo: endText
    };

    const vidDurationObj: VidDuration = {
      totalDuration: totalDuration,
      frontVidDuration: frontVidDuration
    };

    onSubmit(frontTextObj, endTextObj, vidDurationObj);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Video Prompt"
      onSubmit={handleSubmit}
      submitText="Save"
    >
      {/* Front Text */}
      <div>
        <label className="block text-slate-300 text-sm mb-1">Front Text</label>
        <textarea
          value={frontText}
          onChange={(e) => setFrontText(e.target.value)}
          placeholder="Enter front text (one line per item)..."
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 min-h-[100px] resize-y"
        />
      </div>

      {/* Media URL and POV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Media URL</label>
          <select
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select media...</option>
            {availableMedia.map((media) => (
              <option key={media} value={media}>{media}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">POV</label>
          <input
            type="text"
            value={pov}
            onChange={(e) => setPov(e.target.value)}
            placeholder="POV..."
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>
      </div>

      {/* End Text */}
      <div>
        <label className="block text-slate-300 text-sm mb-1">End Text</label>
        <textarea
          value={endText}
          onChange={(e) => setEndText(e.target.value)}
          placeholder="Enter end text..."
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 min-h-[80px] resize-y"
        />
      </div>

      {/* Durations */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Total Duration</label>
          <input
            type="text"
            value={totalDuration}
            onChange={(e) => setTotalDuration(e.target.value)}
            placeholder="e.g., 30s"
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Front Video Duration</label>
          <input
            type="text"
            value={frontVidDuration}
            onChange={(e) => setFrontVidDuration(e.target.value)}
            placeholder="e.g., 5s"
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
          />
        </div>
      </div>
    </Modal>
  );
};

export default EditVideoPromptModal;