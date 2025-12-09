import React, { useState } from 'react';
import API, { VideoPrompt, FrontTextWithMedia, EndText, VidDuration, Account, ImageGenerator } from '../api/api';
import VideoPlayer from './VideoPlayer';
import ImagePromptItem from './ImagePromptItem';
import { AddImagePromptModal, EditVideoPromptModal } from './modals';
import ScheduleButton from './ScheduleButton';

interface VideoPromptItemProps {
  videoPrompt: VideoPrompt;
  activeAccount: Account | null;
  imageGenerator: ImageGenerator;
  imageModel: string;
}

const VideoPromptItem: React.FC<VideoPromptItemProps> = ({ videoPrompt, activeAccount, imageGenerator, imageModel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [showAddImage, setShowAddImage] = useState(false);
  const [showEditVideo, setShowEditVideo] = useState(false);
  
  // Cache buster timestamp - incremented when content changes
  const [videoCacheBuster, setVideoCacheBuster] = useState<number>(Date.now());
  const [imageCacheBusters, setImageCacheBusters] = useState<Record<string, number>>({});

  const hasVideo = videoPrompt.file_url && videoPrompt.file_url !== '';

  // Get title from front text
  const getTitle = () => {
    if (videoPrompt.front_text?.frontText && videoPrompt.front_text.frontText.length > 0) {
      return videoPrompt.front_text.frontText[0];
    }
    return 'No front text';
  };

  // Helper to invalidate video cache
  const invalidateVideoCache = () => {
    setVideoCacheBuster(Date.now());
  };

  // Helper to invalidate a specific image cache
  const invalidateImageCache = (imageId: string) => {
    setImageCacheBusters(prev => ({
      ...prev,
      [imageId]: Date.now()
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video prompt?')) return;
    
    try {
      await API.deleteVideoPrompt(videoPrompt.id);
    } catch (error: any) {
      console.error('Failed to delete video prompt:', error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const handleAddImagePrompt = async (prompt: string) => {
    try {
      await API.createImagePrompt(videoPrompt.id, prompt, imageGenerator, imageGenerator === 'openrouter' ? imageModel : undefined);
      // New image will trigger video regeneration
      invalidateVideoCache();
    } catch (error: any) {
      console.error('Failed to create image:', error);
      alert(`Failed to create image: ${error.message}`);
    }
  };

  const handleEditVideoPrompt = async (
    frontText: FrontTextWithMedia, 
    endText: EndText, 
    vidDuration: VidDuration
  ) => {
    try {
      await API.editVideoPrompt(videoPrompt.id, frontText, endText, vidDuration);
      // Editing video prompt triggers regeneration
      invalidateVideoCache();
    } catch (error: any) {
      console.error('Failed to edit video prompt:', error);
      alert(`Failed to edit: ${error.message}`);
    }
  };

  const handleEditImagePrompt = async (id: string, newPrompt: string) => {
    try {
      await API.editImagePrompt(id, newPrompt, imageGenerator, imageGenerator === 'openrouter' ? imageModel : undefined);
      // Editing image prompt triggers image + video regeneration
      invalidateImageCache(id);
      invalidateVideoCache();
    } catch (error: any) {
      console.error('Failed to edit image prompt:', error);
      alert(`Failed to edit: ${error.message}`);
    }
  };

  const handleEditImageText = async (id: string, newText: string) => {
    try {
      await API.editImageText(id, newText);
      // Editing text triggers video regeneration (text overlay changes)
      invalidateVideoCache();
    } catch (error: any) {
      console.error('Failed to edit image text:', error);
      alert(`Failed to edit: ${error.message}`);
    }
  };

  const handleRegenerateImage = async (id: string) => {
    try {
      await API.regenerateImage(id, imageGenerator, imageGenerator === 'openrouter' ? imageModel : undefined);
      // Regenerating image triggers image + video regeneration
      invalidateImageCache(id);
      invalidateVideoCache();
    } catch (error: any) {
      console.error('Failed to regenerate image:', error);
      alert(`Failed to regenerate: ${error.message}`);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await API.deleteImagePrompt(id);
      // Deleting image triggers video regeneration
      invalidateVideoCache();
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const getImageCacheBuster = (imageId: string): number | undefined => {
    return imageCacheBusters[imageId];
  };

  return (
    <>
      <div className="bg-slate-800 rounded-lg p-4">
        {/* Collapsed Header */}
        <div className="flex items-center gap-3">
          {/* Small Video Thumbnail */}
          <div 
            className={`w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 ${hasVideo ? 'cursor-pointer hover:bg-slate-600' : ''} transition-colors`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasVideo) setActiveVideo(videoPrompt.file_url!);
            }}
          >
            {!hasVideo ? (
              <span className="text-xl">⏳</span>
            ) : (
              <span className="text-xl hover:scale-110 transition-transform">▶️</span>
            )}
          </div>

          {/* Title */}
          <span className="flex-1 text-slate-100 font-medium truncate">
            {getTitle()}
          </span>

          {/* Image count badge */}
          {videoPrompt.image_prompts && videoPrompt.image_prompts.length > 0 && (
            <span className="text-slate-400 text-sm">
              🖼️ {videoPrompt.image_prompts.length}
            </span>
          )}

          {/* ID */}
          <span className="text-slate-500 text-xs">{videoPrompt.id.substring(0, 8)}...</span>

          {/* Expand/Collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              <button
                onClick={() => setShowAddImage(true)}
                className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                title="Add an Image Prompt"
              >
                <span className="text-slate-300">🖼️ Add Image</span>
              </button>

              <button
                onClick={() => setShowEditVideo(true)}
                className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                title="Edit Video Prompt"
              >
                <span className="text-slate-300">✏️ Edit</span>
              </button>

              <button
                onClick={handleDelete}
                className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                title="Delete Video Prompt"
              >
                <span className="text-red-400">🗑️ Delete</span>
              </button>

              {/* Schedule Button - inline with other actions */}
              <div className="ml-auto">
                <ScheduleButton 
                  videoPrompt={videoPrompt}
                  activeAccount={activeAccount}
                />
              </div>
            </div>

            {/* Video Prompt Details */}
            <div className="mb-4 p-3 bg-slate-700 rounded-lg space-y-2">
              {/* Front Text */}
              {videoPrompt.front_text?.frontText && videoPrompt.front_text.frontText.length > 0 && (
                <div>
                  <span className="text-slate-400 text-sm">Front Text:</span>
                  <ul className="text-slate-300 text-sm list-disc list-inside">
                    {videoPrompt.front_text.frontText.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* POV */}
              {videoPrompt.front_text?.POV && (
                <div>
                  <span className="text-slate-400 text-sm">POV: </span>
                  <span className="text-slate-300 text-sm">{videoPrompt.front_text.POV}</span>
                </div>
              )}

              {/* Media */}
              {videoPrompt.front_text?.frontVid && (
                <div>
                  <span className="text-slate-400 text-sm">Media: </span>
                  <span className="text-slate-300 text-sm">{videoPrompt.front_text.frontVid}</span>
                </div>
              )}

              {/* End Text */}
              {videoPrompt.partTwo?.partTwo && (
                <div>
                  <span className="text-slate-400 text-sm">End Text: </span>
                  <span className="text-slate-300 text-sm">{videoPrompt.partTwo.partTwo}</span>
                </div>
              )}

              {/* Duration */}
              {videoPrompt.totalDuration && (
                <div>
                  <span className="text-slate-400 text-sm">Duration: </span>
                  <span className="text-slate-300 text-sm">
                    Total: {videoPrompt.totalDuration.totalDuration}, Front: {videoPrompt.totalDuration.frontVidDuration}
                  </span>
                </div>
              )}
            </div>


            {/* Media Grid */}
            <div className="flex flex-wrap gap-4">
              {/* Generated Video Preview - Larger when expanded */}
              <div className="flex flex-col items-center">
                <div className="w-[200px] text-center mb-1 text-slate-300 text-sm">
                  Generated Video
                </div>
                <div 
                  className={`w-[200px] h-[200px] bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden ${hasVideo ? 'cursor-pointer hover:bg-slate-600' : ''} transition-colors`}
                  onClick={() => hasVideo && setActiveVideo(videoPrompt.file_url!)}
                >
                  {!hasVideo ? (
                    <span className="text-6xl">⏳</span>
                  ) : (
                    <span className="text-6xl hover:scale-110 transition-transform">▶️</span>
                  )}
                </div>
              </div>

              {/* Image Prompts */}
              {videoPrompt.image_prompts && videoPrompt.image_prompts.map((img) => (
                <ImagePromptItem
                  key={img.id}
                  imagePrompt={img}
                  cacheBuster={getImageCacheBuster(img.id)}
                  onEditPrompt={handleEditImagePrompt}
                  onEditText={handleEditImageText}
                  onRegenerate={handleRegenerateImage}
                  onDelete={handleDeleteImage}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeVideo && (
        <VideoPlayer 
          fileUrl={activeVideo} 
          onClose={() => setActiveVideo(null)}
          cacheBuster={videoCacheBuster}
        />
      )}

      <AddImagePromptModal
        isOpen={showAddImage}
        onClose={() => setShowAddImage(false)}
        onSubmit={handleAddImagePrompt}
      />

      <EditVideoPromptModal
        isOpen={showEditVideo}
        onClose={() => setShowEditVideo(false)}
        videoPrompt={videoPrompt}
        onSubmit={handleEditVideoPrompt}
      />

    </>
  );
};

export default VideoPromptItem;