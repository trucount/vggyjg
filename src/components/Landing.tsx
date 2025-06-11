import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Users, Copy, Check, Video, Shield, Zap } from 'lucide-react';
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
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopiedLink(meetingLink);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
    
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
      try {
        await navigator.clipboard.writeText(copiedLink);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="large" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-3">Wispers</h1>
            <p className="text-lg text-gray-600 mb-2">Private video calls, instantly</p>
            <p className="text-sm text-gray-500">No signup required • End-to-end encrypted</p>
          </div>

          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/30">
            {/* Display Name Input */}
            <div className="mb-6">
              <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                What should we call you?
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-center text-lg font-medium placeholder-gray-400"
                maxLength={30}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && displayName.trim()) {
                    handleStartNewCall();
                  }
                }}
              />
            </div>

            {/* Start New Call Button */}
            <button
              onClick={handleStartNewCall}
              disabled={!displayName.trim() || isStartingCall}
              className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white py-4 px-6 rounded-2xl font-semibold hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mb-4 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              {isStartingCall ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Creating your room...
                </div>
              ) : (
                <>
                  <Video className="w-5 h-5 mr-3" />
                  Start New Call
                </>
              )}
            </button>

            {/* Copy Link Notice */}
            {copiedLink && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-700 text-sm font-medium">
                    <Check className="w-5 h-5 mr-2 text-green-600" />
                    Meeting link copied to clipboard!
                  </div>
                  <button
                    onClick={copyMeetingLink}
                    className="text-green-600 hover:text-green-700 p-2 hover:bg-green-100 rounded-lg transition-colors"
                    title="Copy again"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-6 text-gray-500 font-medium">or join existing call</span>
              </div>
            </div>

            {/* Join Existing Call */}
            <div className="mb-4">
              <label htmlFor="roomCode" className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                Enter meeting room code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="room-code-123"
                className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all duration-200 text-center text-lg font-medium placeholder-gray-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && displayName.trim() && roomCode.trim()) {
                    handleJoinCall();
                  }
                }}
              />
            </div>

            <button
              onClick={handleJoinCall}
              disabled={!displayName.trim() || !roomCode.trim() || isJoiningCall}
              className="w-full bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800 text-white py-4 px-6 rounded-2xl font-semibold hover:from-teal-700 hover:via-teal-800 hover:to-teal-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              {isJoiningCall ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Joining call...
                </div>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-3" />
                  Join Call
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/50 backdrop-blur-sm border-t border-white/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Instant Connection</h3>
              <p className="text-sm text-gray-600">Start video calls in seconds without any downloads or registration</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Private & Secure</h3>
              <p className="text-sm text-gray-600">End-to-end encrypted calls with no data stored on our servers</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">High Quality</h3>
              <p className="text-sm text-gray-600">Crystal clear HD video and audio for the best calling experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;