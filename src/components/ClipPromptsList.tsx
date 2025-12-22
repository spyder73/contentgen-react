import React, { useEffect, useState } from 'react';
import API, { ClipPrompt, Account, ImageGenerator } from '../api/api';
import ClipPromptItem from './ClipPromptItem';

interface ClipPromptsListProps {
  onRefresh: number;
  activeAccount: Account | null;
  imageGenerator: ImageGenerator;
  imageModel: string;
}

const ClipPromptsList: React.FC<ClipPromptsListProps> = ({ 
  onRefresh, 
  activeAccount,
  imageGenerator,
  imageModel
}) => {
  const [clipPrompts, setClipPrompts] = useState<ClipPrompt[]>([]);

  const fetchClipPrompts = async () => {
    try {
      const data = await API.getClipPrompts();
      console.log('Fetched clip prompts:', data);
      setClipPrompts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch video prompts:', error);
    }
  };

  useEffect(() => {
    fetchClipPrompts();
  }, [onRefresh]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">🎥 Prompts ({clipPrompts.length})</h2>
      
      {clipPrompts.length === 0 ? (
        <div className="text-center p-8 bg-slate-800 rounded-lg">
          <p className="text-slate-400">No prompts yet. Create one from an idea!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clipPrompts.map((cp) => (
            <ClipPromptItem
              key={cp.id}
              clipPrompt={cp}
              activeAccount={activeAccount}
              imageGenerator={imageGenerator}
              imageModel={imageModel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClipPromptsList;