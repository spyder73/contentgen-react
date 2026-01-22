import React from 'react';
import { Button, Card } from '../ui';

interface Props {
  checkpointName: string;
  output: string;
  allowRegenerate: boolean;
  onContinue: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<Props> = ({
  checkpointName,
  output,
  allowRegenerate,
  onContinue,
  onRegenerate,
  onCancel,
}) => {
  const formatted = (() => {
    try {
      return JSON.stringify(JSON.parse(output), null, 2);
    } catch {
      return output;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-medium text-white">Review: {checkpointName}</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <pre className="bg-gray-900 rounded p-3 text-sm text-gray-300 whitespace-pre-wrap">
            {formatted}
          </pre>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          {allowRegenerate && (
            <Button variant="secondary" onClick={onRegenerate}>↻ Regenerate</Button>
          )}
          <Button onClick={onContinue}>Continue →</Button>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmationModal;