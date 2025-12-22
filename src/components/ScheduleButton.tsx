import React, { useState } from 'react';
import API, { Account, ClipPrompt } from '../api/api';

interface ScheduleButtonProps {
  clipPrompt: ClipPrompt;
  activeAccount: Account | null;
  onScheduled?: () => void;
}

const ScheduleButton: React.FC<ScheduleButtonProps> = ({ 
  clipPrompt, 
  activeAccount,
  onScheduled 
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const hasVideo = clipPrompt.file_url && clipPrompt.file_url !== '';
  const canSchedule = hasVideo && activeAccount && selectedPlatforms.length > 0;

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok': return '🎵';
      case 'instagram': return '📸';
      case 'youtube': return '▶️';
      default: return '🔗';
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSchedule = async () => {
    if (!canSchedule) return;

    setIsScheduling(true);
    try {
      const response = await API.scheduleClip(clipPrompt.id, selectedPlatforms);
      
      if (response.success) {
        alert(`✅ Video scheduled!\n${response.scheduled_date ? `Date: ${response.scheduled_date}` : response.message || 'Success'}`);
        setSelectedPlatforms([]);
        onScheduled?.();
      } else {
        alert(`❌ Failed to schedule: ${response.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  if (!activeAccount) {
    return (
      <div className="text-slate-500 text-sm py-2">
        Select an account to schedule
      </div>
    );
  }

  if (!hasVideo) {
    return (
      <div className="text-slate-500 text-sm py-2">
        🔒 Generate video first
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Platform Selector */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm flex items-center gap-2"
        >
          <span>
            {selectedPlatforms.length > 0 
              ? selectedPlatforms.map(p => getPlatformIcon(p)).join(' ')
              : 'Select Platforms'
            }
          </span>
          <span className="text-xs">▼</span>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-800 rounded-lg shadow-lg z-50 py-2">
              {activeAccount.platforms.map((platform) => (
                <div
                  key={platform}
                  className={`px-4 py-2 hover:bg-slate-700 cursor-pointer flex items-center gap-2 ${
                    selectedPlatforms.includes(platform) ? 'bg-slate-700' : ''
                  }`}
                  onClick={() => togglePlatform(platform)}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <span>{getPlatformIcon(platform)}</span>
                  <span className="text-white text-sm capitalize">{platform}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Schedule Button */}
      <button
        onClick={handleSchedule}
        disabled={!canSchedule || isScheduling}
        className={`px-4 py-2 rounded text-white text-sm font-medium flex items-center gap-2 ${
          canSchedule && !isScheduling
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-slate-600 cursor-not-allowed'
        }`}
      >
        {isScheduling ? (
          <>
            <span className="animate-spin">⏳</span>
            Scheduling...
          </>
        ) : (
          <>
            📅 Schedule
          </>
        )}
      </button>
    </div>
  );
};

export default ScheduleButton;