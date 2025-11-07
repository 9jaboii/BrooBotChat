import React from 'react';
import '../styles/Logo.css';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'medium',
  className = '',
}) => {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large',
  };

  return (
    <div className={`logo-container ${sizeClasses[size]} ${className}`}>
      <img
        src="/broobot-logo.png"
        alt="BrooBot Logo"
        className={`logo-image ${variant === 'icon' ? 'logo-icon' : 'logo-full'}`}
      />
      {variant === 'full' && <span className="logo-text">BrooBot</span>}
    </div>
  );
};
