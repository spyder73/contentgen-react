import React from 'react';

type InputSize = 'sm' | 'md';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  inputSize = 'md',
  error,
  className = '',
  ...props
}) => {
  const sizeClass = inputSize === 'sm' ? 'input-sm' : '';
  const errorClass = error ? 'ring-2 ring-red-500' : '';

  return (
    <div className="w-full">
      <input
        className={`input ${sizeClass} ${errorClass} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};

export default Input;