import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { ClipPrompt } from '../../api/structs/clip';
import { Account } from '../../api/structs/user';
import { MediaProfile } from '../../api/structs/media-spec';
import ClipPromptItem from './ClipPromptItem';

interface ClipPromptsListProps {
  refreshTrigger: number;
  mediaProfile: MediaProfile;
  activeAccount: Account | null;
}

const ClipPromptsList: React.FC<ClipPromptsListProps> = ({
  refreshTrigger,
  mediaProfile,
  activeAccount,
}) => {
  const [clips, setClips] = useState<ClipPrompt[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchClips = async () => {
    try {
      const data = await API.getClipPrompts();
      setClips(data || []);
    } catch (error) {
      console.error('Failed to fetch clips:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, [refreshTrigger]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading clips...</div>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-8 text-slate-500">
          No clips yet. Generate some ideas to get started!
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="section-title">🎬 Clips ({clips.length})</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 pr-2">
          {clips.map((clip) => (
            <ClipPromptItem
              key={clip.id}
              clip={clip}
              isExpanded={expandedId === clip.id}
              onToggleExpand={() => setExpandedId(expandedId === clip.id ? null : clip.id)}
              onRefresh={fetchClips}
              mediaProfile={mediaProfile}
              activeAccount={activeAccount}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClipPromptsList;
