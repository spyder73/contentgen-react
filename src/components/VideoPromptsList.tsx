import React, { useEffect, useState } from 'react';
import API, { VideoPrompt, Account, ImageGenerator } from '../api/api';
import VideoPromptItem from './VideoPromptItem';

interface VideoPromptsListProps {
  onRefresh: number;
  activeAccount: Account | null;
  imageGenerator: ImageGenerator;
  imageModel: string;
}

const VideoPromptsList: React.FC<VideoPromptsListProps> = ({ 
  onRefresh, 
  activeAccount,
  imageGenerator,
  imageModel
}) => {
  const [videoPrompts, setVideoPrompts] = useState<VideoPrompt[]>([]);

  const fetchVideoPrompts = async () => {
    try {
      const data = await API.getVideoPrompts();
      console.log('Fetched video prompts:', data);
      setVideoPrompts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch video prompts:', error);
    }
  };

  useEffect(() => {
    fetchVideoPrompts();
  }, [onRefresh]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">🎥 Prompts ({videoPrompts.length})</h2>
      
      {videoPrompts.length === 0 ? (
        <div className="text-center p-8 bg-slate-800 rounded-lg">
          <p className="text-slate-400">No prompts yet. Create one from an idea!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {videoPrompts.map((vp) => (
            <VideoPromptItem
              key={vp.id}
              videoPrompt={vp}
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

export default VideoPromptsList;