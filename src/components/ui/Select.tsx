import React from 'react';

type SelectSize = 'sm' | 'md';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  selectSize?: SelectSize;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  selectSize = 'md',
  placeholder,
  className = '',
  ...props
}) => {
  const sizeClass = selectSize === 'sm' ? 'select-sm' : '';

  return (
    <select className={`select ${sizeClass} ${className}`} {...props}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;