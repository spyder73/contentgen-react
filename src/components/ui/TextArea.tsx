import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className = '',
  rows = 3,
  ...props
}) => {
  const errorClass = error ? 'ring-2 ring-red-500' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
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