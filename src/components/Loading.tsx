import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Loading: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/room/${roomId}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [roomId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-teal-600">
      <div className="text-center">
        {/* Animated Logo - Centered */}
        <div className="mb-8 animate-pulse flex justify-center">
          <Logo size="large" color="white" />
        </div>

        {/* App Title - Centered */}
        <h1 className="text-4xl font-bold text-white mb-4 animate-fade-in text-center">
          Wispers
        </h1>

        {/* Loading Text - Centered */}
        <p className="text-xl text-white/80 mb-8 animate-fade-in-delay text-center">
          Connecting to your private room...
        </p>

        {/* Loading Animation - Centered */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Room ID - Centered */}
        <div className="mt-8 text-white/60 text-sm text-center">
          Room: {roomId}
        </div>
      </div>
    </div>
  );
};

export default Loading;