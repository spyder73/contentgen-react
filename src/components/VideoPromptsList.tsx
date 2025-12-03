import React, { useEffect, useState } from 'react';
import API, { VideoPrompt, ImagePrompt, constructImageUrl, FrontTextWithMedia, EndText, VidDuration } from '../api/api';
import VideoPlayer from './VideoPlayer';

interface VideoPromptsListProps {
  onRefresh: number;
}

const VideoPromptsList: React.FC<VideoPromptsListProps> = ({ onRefresh }) => {
  const [videoPrompts, setVideoPrompts] = useState<VideoPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMedia, setAvailableMedia] = useState<string[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const fetchVideoPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API.getVideoPrompts();
      console.log('Fetched video prompts:', data);
      setVideoPrompts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch video prompts:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load video prompts');
      setVideoPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMedia = async () => {
    try {
      const media = await API.getAvailableMedia();
      setAvailableMedia(media);
    } catch (error) {
      console.error('Failed to fetch available media:', error);
    }
  };

  useEffect(() => {
    fetchVideoPrompts();
    fetchAvailableMedia();
  }, [onRefresh]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video prompt?')) return;
    
    try {
      await API.deleteVideoPrompt(id);
      await fetchVideoPrompts();
    } catch (error: any) {
      console.error('Failed to delete video prompt:', error);
      alert(`Failed to delete video prompt: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAddImagePrompt = async (videoPromptId: string) => {
    const prompt = window.prompt('Add Image Prompt\n\nEnter Prompt:');
    if (!prompt) return;

    try {
      await API.createImagePrompt(videoPromptId, prompt);
      await fetchVideoPrompts();
    } catch (error: any) {
      console.error('Failed to create image:', error);
      alert(`Failed to create image: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEditVideoPrompt = async (vp: VideoPrompt) => {
    const frontText = window.prompt(
      'Edit Front Text (separate lines with \\n):',
      vp.front_text?.frontText.join('\n') || ''
    );
    if (frontText === null) return;

    const mediaUrl = window.prompt(
      'Media URL (or select from dropdown):\n\nAvailable: ' + availableMedia.join(', '),
      vp.front_text?.frontVid || ''
    );
    if (mediaUrl === null) return;

    const pov = window.prompt('POV:', vp.front_text?.POV || '');
    if (pov === null) return;

    const endText = window.prompt('End Text:', vp.partTwo?.partTwo || '');
    if (endText === null) return;

    const totalDuration = window.prompt('Total Duration:', vp.totalDuration?.totalDuration || '');
    if (totalDuration === null) return;

    const frontVidDuration = window.prompt('Front Video Duration:', vp.totalDuration?.frontVidDuration || '');
    if (frontVidDuration === null) return;

    try {
      const frontTextObj: FrontTextWithMedia = {
        frontText: frontText.split('\n'),
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

      await API.editVideoPrompt(vp.id, frontTextObj, endTextObj, vidDurationObj);
      await fetchVideoPrompts();
    } catch (error: any) {
      console.error('Failed to edit video prompt:', error);
      alert(`Failed to edit video prompt: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEditImagePrompt = async (imagePrompt: ImagePrompt) => {
    const newPrompt = window.prompt('Edit Prompt:', imagePrompt.prompt);
    if (!newPrompt) return;

    try {
      await API.editImagePrompt(imagePrompt.id, newPrompt);
      await fetchVideoPrompts();
    } catch (error: any) {
      console.error('Failed to edit image prompt:', error);
      alert(`Failed to edit image prompt: ${error.message}`);
    }
  };

  const handleEditImageText = async (imagePrompt: ImagePrompt) => {
    const newText = window.prompt('Edit Text:', imagePrompt.text);
    if (!newText) return;

    try {
      await API.editImageText(imagePrompt.id, newText);
      await fetchVideoPrompts();
    } catch (error: any) {
      console.error('Failed to edit image text:', error);
      alert(`Failed to edit image text: ${error.message}`);
    }
  };

  const handleRegenerateImage = async (imagePrompt: ImagePrompt) => {
    try {
      await API.regenerateImage(imagePrompt.id);
      await fetchVideoPrompts();
    } catch (error: any) {
      console.error('Failed to regenerate image:', error);
      alert(`Failed to regenerate image: ${error.message}`);
    }
  };

  const handleDeleteImagePrompt = async (imagePrompt: ImagePrompt) => {
    try {
      await API.deleteImagePrompt(imagePrompt.id);
      await fetchVideoPrompts();
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      alert(`Failed to delete image: ${error.message}`);
    }
  };

  const handleVideoClick = (vp: VideoPrompt) => {
    if (vp.file_url && vp.file_url !== '') {
      setActiveVideo(vp.file_url);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchVideoPrompts}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">🎥 Prompts ({videoPrompts.length})</h2>
      
      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayer 
          fileUrl={activeVideo} 
          onClose={() => setActiveVideo(null)} 
        />
      )}

      {videoPrompts.length === 0 ? (
        <div className="text-center p-8 bg-slate-800 rounded-lg">
          <p className="text-slate-400">No prompts yet. Create one from an idea!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {videoPrompts.map((vp) => {
            const hasVideo = vp.file_url && vp.file_url !== '';
            
            return (
              <div
                key={vp.id}
                className="bg-slate-800 rounded-lg p-6"
              >
                {/* Header with actions */}
                <div className="flex gap-2 mb-4 items-center">
                  <button
                    onClick={() => handleAddImagePrompt(vp.id)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Add an Image Prompt"
                  >
                    <span className="text-slate-300">🖼️</span>
                  </button>

                  <button
                    onClick={() => handleEditVideoPrompt(vp)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Edit Video Prompt"
                  >
                    <span className="text-slate-300">✏️</span>
                  </button>

                  <button
                    onClick={() => handleDelete(vp.id)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-red-400"
                    title="Delete Video Prompt"
                  >
                    <span>🗑️</span>
                  </button>

                  <span className="flex-1 text-slate-100 font-bold">
                    {vp.front_text?.frontText.join(', ') || 'No front text'}
                  </span>

                  <span className="text-slate-500 text-sm">{vp.id}</span>
                </div>

                {/* Media Grid */}
                <div className="flex flex-wrap gap-4">
                  {/* Generated Video Preview */}
                  <div className="flex flex-col items-center">
                    <div className="w-[200px] text-center mb-1 text-slate-300 text-sm">
                      &nbsp;
                    </div>
                    <div 
                      className={`w-[200px] h-[200px] bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden ${hasVideo ? 'cursor-pointer hover:bg-slate-600' : ''} transition-colors`}
                      onClick={() => handleVideoClick(vp)}
                    >
                      {!hasVideo ? (
                        <span className="text-6xl">⏳</span>
                      ) : (
                        <span className="text-6xl hover:scale-110 transition-transform">▶️</span>
                      )}
                    </div>
                  </div>

                  {/* Image Prompts */}
                  {vp.image_prompts && vp.image_prompts.map((img) => {
                    const isWaiting = img.file_url === '/assets/_waiting.png';
                    
                    return (
                      <div key={img.id} className="flex flex-col items-center">
                        <div className="w-[200px] text-center mb-1 text-slate-300 text-sm truncate">
                          {img.text}
                        </div>
                        
                        <img
                          src={constructImageUrl(img.file_url)}
                          alt={img.text}
                          className="w-[200px] h-[200px] object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => {
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                            modal.onclick = () => modal.remove();
                            modal.innerHTML = `<img src="${constructImageUrl(img.file_url)}" class="max-h-[90vh] max-w-[90vw] object-contain" />`;
                            document.body.appendChild(modal);
                          }}
                        />

                        <div className="w-[200px] flex justify-end gap-1 mt-1">
                          <button
                            onClick={() => handleEditImagePrompt(img)}
                            disabled={isWaiting}
                            className={`p-1 rounded text-sm ${isWaiting ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-600'}`}
                            title="Edit the Prompt"
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() => handleEditImageText(img)}
                            disabled={isWaiting}
                            className={`p-1 rounded text-sm ${isWaiting ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-600'}`}
                            title="Edit the Text"
                          >
                            📝
                          </button>

                          <button
                            onClick={() => handleRegenerateImage(img)}
                            disabled={isWaiting}
                            className={`p-1 rounded text-sm ${isWaiting ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-600'}`}
                            title="Regenerate"
                          >
                            🔄
                          </button>

                          <button
                            onClick={() => handleDeleteImagePrompt(img)}
                            disabled={isWaiting}
                            className={`p-1 rounded text-sm ${isWaiting ? 'text-slate-600' : 'text-red-400 hover:bg-slate-600'}`}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VideoPromptsList;