import React, { useState } from 'react';
import { Idea } from '../../api/structs/clip';
import { Button, Card, Badge } from '../ui';

interface IdeaItemProps {
  idea: Idea;
  onCreatePrompt: (idea: Idea) => void;
  onDelete: (clipIdea: string) => void;
}

const IdeaItem: React.FC<IdeaItemProps> = ({ idea, onCreatePrompt, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const isReady = !!idea.clip_prompt_json;

  return (
    <Card hover className="animate-fade-in">
      <Card.Body>
        <div className="flex items-start justify-between gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isReady ? (
                <Badge variant="green">Ready</Badge>
              ) : (
                <Badge variant="yellow">Generating...</Badge>
              )}
            </div>
            <p className={`text-white text-sm ${expanded ? '' : 'truncate-2'}`}>
              {idea.clip_idea}
            </p>
            {idea.clip_idea.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-blue-400 hover:text-blue-300 text-xs mt-1"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="success"
              size="sm"
              onClick={() => onCreatePrompt(idea)}
              disabled={!isReady}
            >
              ✨ Create
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(idea.clip_idea)}
            >
              🗑️
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default IdeaItem;