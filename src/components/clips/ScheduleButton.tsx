import React, { useState } from 'react';
import API from '../../api/api';
import { Account } from '../../api/structs/user';
import { Button } from '../ui';

interface ScheduleButtonProps {
  clipId: string;
  activeAccount: Account;
}

const ScheduleButton: React.FC<ScheduleButtonProps> = ({ clipId, activeAccount }) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSchedule = async () => {
    setIsScheduling(true);
    setResult(null);
    try {
      const response = await API.scheduleClip(clipId, activeAccount.platforms);
      if (response.success) {
        setResult(`✓ Scheduled for ${response.scheduled_date}`);
      } else {
        setResult(`✗ ${response.error}`);
      }
    } catch (error: any) {
      setResult(`✗ ${error.message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="success"
        onClick={handleSchedule}
        disabled={isScheduling}
        loading={isScheduling}
        className="w-full"
      >
        📅 Schedule to {activeAccount.platforms.join(', ')}
      </Button>
      {result && (
        <p className={`text-sm ${result.startsWith('✓') ? 'text-success' : 'text-danger'}`}>
          {result}
        </p>
      )}
    </div>
  );
};

export default ScheduleButton;