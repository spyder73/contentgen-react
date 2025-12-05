import React, { useState } from 'react';
import { Idea } from '../api/api';

interface IdeaItemProps {
  idea: Idea;
  onCreatePrompt: (idea: Idea) => void;
  onDelete: (videoIdea: string) => void;
}

const IdeaItem: React.FC<IdeaItemProps> = ({ idea, onCreatePrompt, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if the idea is still being generated (no JSON yet or empty)
  const isGenerating = !idea.video_prompt_json || idea.video_prompt_json.trim() === '';
  
  // Parse the JSON to get details
  let parsedJson: any = null;
  let parseError = false;
  
  if (!isGenerating) {
    try {
      parsedJson = JSON.parse(idea.video_prompt_json);
    } catch (e) {
      parseError = true;
    }
  }

  // Extract title from the idea or JSON
  const getTitle = () => {
    if (parsedJson?.frontText?.frontText) {
      const frontText = parsedJson.frontText.frontText;
      if (Array.isArray(frontText) && frontText.length > 0) {
        return frontText[0];
      }
    }
    // Fallback to the video_idea, truncated
    return idea.video_idea.length > 100 
      ? idea.video_idea.substring(0, 100) + '...' 
      : idea.video_idea;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <p className="text-slate-200 font-medium">{getTitle()}</p>
          
          {isGenerating && (
            <span className="text-yellow-500 text-sm">⏳ Generating...</span>
          )}
          
          {parseError && (
            <span className="text-red-400 text-sm">⚠️ Invalid JSON</span>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          {/* Expand/Collapse button */}
          {!isGenerating && parsedJson && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
          
          <button
            onClick={() => onCreatePrompt(idea)}
            disabled={isGenerating || parseError}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded text-sm"
            title={isGenerating ? 'Waiting for generation...' : 'Create Video Prompt'}
          >
            {isGenerating ? '⏳' : '✨ Create'}
          </button>
          
          <button
            onClick={() => onDelete(idea.video_idea)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            title="Delete Idea"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Expanded JSON Details */}
      {isExpanded && parsedJson && (
        <div className="mt-4 p-4 bg-slate-700 rounded-lg space-y-3">
          {/* Original Idea */}
          <div>
            <span className="text-slate-400 text-sm">Original Idea:</span>
            <p className="text-slate-300 text-sm">{idea.video_idea}</p>
          </div>

          {/* Front Text */}
          {parsedJson.frontText?.frontText && (
            <div>
              <span className="text-slate-400 text-sm">Front Text:</span>
              <ul className="text-slate-300 text-sm list-disc list-inside">
                {parsedJson.frontText.frontText.map((text: string, i: number) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </div>
          )}

          {/* POV */}
          {parsedJson.frontText?.POV && (
            <div>
              <span className="text-slate-400 text-sm">POV: </span>
              <span className="text-slate-300 text-sm">{parsedJson.frontText.POV}</span>
            </div>
          )}

          {/* Media URL */}
          {parsedJson.frontText?.frontVid && (
            <div>
              <span className="text-slate-400 text-sm">Media: </span>
              <span className="text-slate-300 text-sm">{parsedJson.frontText.frontVid}</span>
            </div>
          )}

          {/* End Text */}
          {parsedJson.partTwo?.partTwo && (
            <div>
              <span className="text-slate-400 text-sm">End Text: </span>
              <span className="text-slate-300 text-sm">{parsedJson.partTwo.partTwo}</span>
            </div>
          )}

          {/* Duration */}
          {parsedJson.vidDuration && (
            <div>
              <span className="text-slate-400 text-sm">Duration: </span>
              <span className="text-slate-300 text-sm">
                Total: {parsedJson.vidDuration.totalDuration}, Front: {parsedJson.vidDuration.frontVidDuration}
              </span>
            </div>
          )}

          {/* Image Prompts */}
          {parsedJson.imagePrompts && parsedJson.imagePrompts.length > 0 && (
            <div>
              <span className="text-slate-400 text-sm">Image Prompts ({parsedJson.imagePrompts.length}):</span>
              <ul className="text-slate-300 text-sm list-disc list-inside">
                {parsedJson.imagePrompts.map((img: any, i: number) => (
                  <li key={i} className="truncate">
                    <strong>{img.text}:</strong> {img.prompt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw JSON (collapsible) */}
          <details className="mt-2">
            <summary className="text-slate-400 text-sm cursor-pointer hover:text-slate-300">
              Show Raw JSON
            </summary>
            <pre className="text-slate-300 text-xs mt-2 p-2 bg-slate-800 rounded overflow-x-auto">
              {JSON.stringify(parsedJson, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default IdeaItem;