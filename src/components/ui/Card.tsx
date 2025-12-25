import React from 'react';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
} = ({ children, hover = false, className = '', onClick }) => {
  const baseClass = hover ? 'card-hover' : 'card';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <div className={`${baseClass} ${clickableClass} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

export default Card;