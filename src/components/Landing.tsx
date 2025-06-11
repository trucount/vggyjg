import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Users, Copy, Check } from 'lucide-react';
import { generateRoomId } from '../utils/roomUtils';
import Logo from './Logo';

const Landing: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  const navigate = useNavigate();

  const handleStartNewCall = async () => {
    if (!displayName.trim()) return;
    
    setIsStartingCall(true);
    const roomId = generateRoomId();
    
    // Store display name in sessionStorage
    sessionStorage.setItem('displayName', displayName.trim());
    
    // Generate and copy meeting link
    const meetingLink = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(meetingLink);
    setCopiedLink(meetingLink);
    
    setTimeout(() => {
      navigate(`/loading/${roomId}`);
    }, 1500);
  };

  const handleJoinCall = () => {
    if (!displayName.trim() || !roomCode.trim()) return;
    
    setIsJoiningCall(true);
    sessionStorage.setItem('displayName', displayName.trim());
    
    setTimeout(() => {
      navigate(`/loading/${roomCode}`);
    }, 800);
  };

  const copyMeetingLink = async () => {
    if (copiedLink) {
      await navigator.clipboard.writeText(copiedLink);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title - Centered */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Wispers</h1>
          <p className="text-gray-600">Private video calls, instantly</p>
        </div>

        {/* Main Card - Centered */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          {/* Display Name Input */}
          <div className="mb-6">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Your display name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 text-center"
              maxLength={30}
            />
          </div>

          {/* Start New Call Button */}
          <button
            onClick={handleStartNewCall}
            disabled={!displayName.trim() || isStartingCall}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] mb-4 flex items-center justify-center"
          >
            {isStartingCall ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Generating link...
              </div>
            ) : (
              <>
                <Phone className="w-5 h-5 mr-2" />
                Start New Call
              </>
            )}
          </button>

          {/* Copy Link Notice */}
          {copiedLink && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-700 text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  Meeting link copied!
                </div>
                <button
                  onClick={copyMeetingLink}
                  className="text-green-600 hover:text-green-700 p-1"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">or</span>
            </div>
          </div>

          {/* Join Existing Call */}
          <div className="mb-4">
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Meeting room code
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toLowerCase())}
              placeholder="Enter room code"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200 text-center"
            />
          </div>

          <button
            onClick={handleJoinCall}
            disabled={!displayName.trim() || !roomCode.trim() || isJoiningCall}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
          >
            {isJoiningCall ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Joining...
              </div>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                Join Call
              </>
            )}
          </button>
        </div>

        {/* Footer - Centered */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>No registration required • End-to-end encrypted • Completely private</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;