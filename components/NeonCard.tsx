
import React from 'react';
import { AccentColor } from '../types';

interface NeonCardProps {
  children: React.ReactNode;
  accent?: AccentColor;
  className?: string;
  onClick?: () => void;
}

const NeonCard: React.FC<NeonCardProps> = ({ children, accent = 'cyan', className = '', onClick }) => {
  const accentClass = `accent-${accent}`;
  
  return (
    <div
      className={`neon-border rounded-xl p-4 md:p-6 transition-transform duration-300 hover:scale-105 ${accentClass} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default NeonCard;
