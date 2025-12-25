import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { ClipPrompt } from '../../api/structs/clip';
import { Account } from '../../api/structs/user';
import { ImageProvider } from '../../api/structs/providers';
import ClipPromptItem from './ClipPromptItem';

interface ClipPromptsListProps {
  onRefresh: number;
  onTriggerRefresh: () => void;
  imageProvider: ImageProvider;
  imageModel: string;
  activeAccount: Account | null;
}

const ClipPromptsList: React.FC<ClipPromptsListProps> = ({
  onRefresh,
  onTriggerRefresh,
  imageProvider,
  imageModel,
  activeAccount,
}) => {
  const [clipPrompts, setClipPrompts] = useState<ClipPrompt[]>([]);
  const [expandedClipId, setExpandedClipId] = useState<string | null>(null);

  const fetchClipPrompts = async () => {
    try {
      const data = await API.getClipPrompts();
      setClipPrompts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch clip prompts:', error);
    }
  };

  useEffect(() => {
    fetchClipPrompts();
  }, [onRefresh]);

  const handleDelete = async (clipId: string) => {
    try {
      await API.deleteClipPrompt(clipId);
      fetchClipPrompts();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  const handleToggleExpand = (clipId: string) => {
    setExpandedClipId(expandedClipId === clipId ? null : clipId);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="section-title">🎬 Clips ({clipPrompts.length})</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {clipPrompts.length === 0 ? (
          <div className="list-empty">
            <p>No clips yet. Create one from an idea!</p>
          </div>
        ) : (
          <div className="list-container">
            {clipPrompts.map((clip) => (
              <ClipPromptItem
                key={clip.id}
                clip={clip}
                isExpanded={expandedClipId === clip.id}
                onToggleExpand={() => handleToggleExpand(clip.id)}
                onDelete={() => handleDelete(clip.id)}
                onRefresh={onTriggerRefresh}
                imageProvider={imageProvider}
                imageModel={imageModel}
                activeAccount={activeAccount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClipPromptsList;