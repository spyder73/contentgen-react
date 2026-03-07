import React, { useEffect, useMemo, useState } from 'react';
import { Account } from '../../../api/structs/user';
import { Button, Badge, TextArea } from '../../ui';
import API from '../../../api/api';

interface ScheduleSectionProps {
  clipId: string;
  initialCaption: string;
  activeAccount: Account;
  fileUrls: string[];
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  clipId,
  initialCaption,
  activeAccount,
  fileUrls,
}) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [caption, setCaption] = useState(initialCaption);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(activeAccount.platforms);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setSelectedPlatforms(activeAccount.platforms);
  }, [activeAccount.platforms]);

  useEffect(() => {
    setCaption(initialCaption);
  }, [initialCaption]);

  const captionChanged = useMemo(() => caption !== initialCaption, [caption, initialCaption]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => (
      prev.includes(platform)
        ? prev.filter((value) => value !== platform)
        : [...prev, platform]
    ));
  };

  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0) {
      setResult({
        success: false,
        message: 'Select at least one platform before scheduling.',
      });
      return;
    }

    setIsScheduling(true);
    setResult(null);

    try {
      if (captionChanged) {
        await API.editClipMetadata(clipId, 'caption', caption);
      }

      const response = await API.scheduleClip(clipId, selectedPlatforms);
      if (response.success) {
        setResult({
          success: true,
          message:
            response.message ||
            (response.scheduled_date
              ? `Scheduled for ${response.scheduled_date}`
              : response.run_id
                ? `Scheduling run queued (${response.run_id})`
                : 'Scheduling accepted'),
        });
      } else {
        setResult({
          success: false,
          message: response.error || response.message || 'Unknown error',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to schedule clip',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Account Info */}
      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg">
          👤
        </div>
        <div>
          <p className="text-white font-medium">{activeAccount.username}</p>
          <div className="flex gap-1 mt-1">
            {activeAccount.platforms.map((platform) => (
              <Badge key={platform} variant="gray">
                {platform}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="attachment-state">Platforms</label>
        {activeAccount.platforms.length === 0 ? (
          <p className="attachment-meta">No platforms available for this account.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeAccount.platforms.map((platform) => (
                <label
                  key={platform}
                  className="flex items-center gap-2 rounded border border-white/15 px-2 py-1 text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    aria-label={platform}
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => togglePlatform(platform)}
                    disabled={isScheduling}
                  />
                  <span className="truncate">{platform}</span>
                </label>
              ))}
            </div>
            <p className="attachment-meta">
              {selectedPlatforms.length} of {activeAccount.platforms.length} selected
            </p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <label className="attachment-state">Caption</label>
        <TextArea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          rows={4}
          placeholder="Write the post caption..."
          disabled={isScheduling}
        />
        <p className="attachment-meta">
          {captionChanged
            ? 'Caption edits will be saved to clip metadata before scheduling.'
            : 'Using caption currently saved on this clip.'}
        </p>
      </div>

      {/* Files to Upload */}
      <div className="p-3 bg-slate-800/30 rounded-lg">
        <p className="text-slate-400 text-sm mb-2">Files to upload:</p>
        <ul className="text-xs text-slate-500 space-y-1">
          {fileUrls.map((url, i) => (
            <li key={i} className="truncate">
              📄 {url.split('/').pop()}
            </li>
          ))}
        </ul>
      </div>

      {/* Schedule Button */}
      <Button
        variant="success"
        onClick={handleSchedule}
        disabled={isScheduling || selectedPlatforms.length === 0}
        loading={isScheduling}
        className="w-full"
      >
        📅 Schedule to {selectedPlatforms.join(', ')}
      </Button>

      {/* Result Message */}
      {result && (
        <div
          className={`p-3 rounded-lg text-sm ${
            result.success
              ? 'bg-green-900/30 text-green-400 border border-green-800'
              : 'bg-red-900/30 text-red-400 border border-red-800'
          }`}
        >
          {result.success ? '✓' : '✗'} {result.message}
        </div>
      )}
    </div>
  );
};

export default ScheduleSection;
