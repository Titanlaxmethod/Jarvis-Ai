
import React from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-24 w-48">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full transition-all duration-150 ${
            isActive ? 'animate-pulse' : ''
          }`}
          style={{
            width: '4px',
            height: isActive 
              ? `${Math.random() * 60 + 10}px` 
              : '4px',
            animationDelay: `${i * 50}ms`,
            animationDuration: `${Math.random() * 500 + 500}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
