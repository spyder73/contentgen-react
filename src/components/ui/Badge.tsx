import React from 'react';

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  blue: 'badge-blue',
  green: 'badge-green',
  yellow: 'badge-yellow',
  red: 'badge-red',
  purple: 'badge-purple',
  gray: 'badge-gray',
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'blue',
  children,
  className = '',
}) => {
  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;