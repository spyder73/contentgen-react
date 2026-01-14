import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  error,
  className = '',
  rows = 3,
  ...props
}) => {
  const errorClass = error ? 'ring-2 ring-red-500' : '';

  return (
    <div className="w-full">
      <textarea
        className={`textarea ${errorClass} ${className}`}
        rows={rows}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default TextArea;