import React, { useState } from 'react';
import { Account } from '../../../api/structs/user';
import { Button, Badge } from '../../ui';
import API from '../../../api/api';

interface ScheduleSectionProps {
  clipId: string;
  activeAccount: Account;
  fileUrls: string[];
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  clipId,
  activeAccount,
  fileUrls,
}) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSchedule = async () => {
    setIsScheduling(true);
    setResult(null);
    try {
      const response = await API.scheduleClip(clipId, activeAccount.platforms);
      if (response.success) {
        setResult({
          success: true,
          message: `Scheduled for ${response.scheduled_date}`,
        });
      } else {
        setResult({
          success: false,
          message: response.error || 'Unknown error',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to schedule',
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
        disabled={isScheduling}
        loading={isScheduling}
        className="w-full"
      >
        📅 Schedule to {activeAccount.platforms.join(', ')}
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