import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Mic, MicOff, Video, VideoOff, Phone, Users } from 'lucide-react';
import { WebRTCService } from '../services/webrtc';

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webrtcService = useRef<WebRTCService | null>(null);

  useEffect(() => {
    const storedName = sessionStorage.getItem('displayName');
    if (storedName) {
      setDisplayName(storedName);
      initializeWebRTC(storedName);
    } else {
      navigate('/');
    }

    return () => {
      if (webrtcService.current) {
        webrtcService.current.disconnect();
      }
    };
  }, [navigate, roomId]);

  const initializeWebRTC = async (name: string) => {
    try {
      webrtcService.current = new WebRTCService(roomId!, name);
      
      webrtcService.current.onLocalStream = (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      };

      webrtcService.current.onRemoteStream = (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      webrtcService.current.onConnectionStateChange = (connected) => {
        setIsConnected(connected);
      };

      webrtcService.current.onParticipantsChange = (participantList) => {
        setParticipants(participantList);
      };

      await webrtcService.current.initialize();
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
    }
  };

  const copyMeetingLink = async () => {
    const meetingLink = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleLeaveCall = () => {
    if (webrtcService.current) {
      webrtcService.current.disconnect();
    }
    navigate('/');
  };

  const toggleAudio = () => {
    if (webrtcService.current) {
      const newState = !isAudioEnabled;
      webrtcService.current.toggleAudio(newState);
      setIsAudioEnabled(newState);
    }
  };

  const toggleVideo = () => {
    if (webrtcService.current) {
      const newState = !isVideoEnabled;
      webrtcService.current.toggleVideo(newState);
      setIsVideoEnabled(newState);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header - Centered */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLeaveCall}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave Call
            </button>
            <div className="text-white">
              <span className="text-sm opacity-75">Room:</span>
              <span className="ml-2 font-mono text-sm bg-white/20 px-2 py-1 rounded">
                {roomId}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-white text-sm">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={copyMeetingLink}
              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Share Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video Container - Centered */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Main Video Area */}
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl mb-6" style={{ aspectRatio: '16/9' }}>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Connection Status */}
            <div className="absolute top-4 left-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              }`}>
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>

            {/* No Remote Video Placeholder */}
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium">Waiting for others to join...</p>
                  <p className="text-sm text-gray-300 mt-2">Share the meeting link to invite participants</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls - Centered */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all duration-200 ${
                isAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all duration-200 ${
                isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            <button
              onClick={handleLeaveCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;