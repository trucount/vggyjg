import React from 'react';
import { AudioWaveform } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'medium',
  color = 'default'
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const colorClasses = {
    default: 'text-purple-600',
    white: 'text-white'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Outer glow ring */}
      <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gradient-to-r from-purple-400 to-teal-400 opacity-20 animate-pulse`}></div>
      
      {/* Main logo container */}
      <div className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-r from-purple-600 to-teal-600 flex items-center justify-center shadow-lg`}>
        <AudioWaveform 
          className={`${colorClasses[color]} ${
            size === 'small' ? 'w-4 h-4' : 
            size === 'medium' ? 'w-6 h-6' : 
            'w-8 h-8'
          }`} 
        />
        
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-full bg-white/10"></div>
      </div>
    </div>
  );
};

export default Logo;