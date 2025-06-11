import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Mic, MicOff, Video, VideoOff, Phone, Users, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { WebRTCService, Participant } from '../services/webrtc';

interface RemoteVideo {
  peerId: string;
  stream: MediaStream;
  participant: Participant;
}

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteVideos, setRemoteVideos] = useState<RemoteVideo[]>([]);
  const [error, setError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const webrtcService = useRef<WebRTCService | null>(null);

  useEffect(() => {
    const storedName = sessionStorage.getItem('displayName');
    if (storedName && roomId) {
      setDisplayName(storedName);
      initializeWebRTC(storedName, roomId);
    } else {
      navigate('/');
    }

    return () => {
      if (webrtcService.current) {
        webrtcService.current.disconnect();
      }
    };
  }, [navigate, roomId]);

  const initializeWebRTC = async (name: string, room: string) => {
    try {
      setIsInitializing(true);
      setError('');
      
      webrtcService.current = new WebRTCService(room, name);
      
      webrtcService.current.onLocalStream = (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      };

      webrtcService.current.onRemoteStream = (peerId, stream, participant) => {
        setRemoteVideos(prev => {
          const existing = prev.find(v => v.peerId === peerId);
          if (existing) {
            return prev.map(v => v.peerId === peerId ? { ...v, stream, participant } : v);
          }
          return [...prev, { peerId, stream, participant }];
        });
      };

      webrtcService.current.onRemoteStreamRemoved = (peerId) => {
        setRemoteVideos(prev => prev.filter(v => v.peerId !== peerId));
      };

      webrtcService.current.onConnectionStateChange = (connected) => {
        setIsConnected(connected);
      };

      webrtcService.current.onParticipantsChange = (participantList) => {
        setParticipants(participantList);
      };

      webrtcService.current.onError = (errorMessage) => {
        setError(errorMessage);
      };

      await webrtcService.current.initialize();
      setIsInitializing(false);
      
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize video call');
      setIsInitializing(false);
    }
  };

  // Update video elements when remote videos change
  useEffect(() => {
    remoteVideos.forEach(({ peerId, stream }) => {
      const videoElement = remoteVideoRefs.current.get(peerId);
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteVideos]);

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

  const retryConnection = () => {
    if (roomId && displayName) {
      initializeWebRTC(displayName, roomId);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Initializing video call...</p>
          <p className="text-sm text-gray-400 mt-2">Getting camera and microphone ready</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={retryConnection}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleLeaveCall}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLeaveCall}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave
            </button>
            <div className="hidden sm:flex items-center text-white">
              <span className="text-sm opacity-75">Room:</span>
              <span className="ml-2 font-mono text-sm bg-gray-700/50 px-2 py-1 rounded">
                {roomId}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center text-white text-sm">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400 mr-1" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400 mr-1" />
              )}
              <span className="hidden sm:inline">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
              <span className="sm:hidden">
                {participants.length}
              </span>
            </div>
            <button
              onClick={copyMeetingLink}
              className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex flex-col p-2 sm:p-4">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {remoteVideos.length > 0 ? (
            <div className={`grid gap-2 h-full ${
              remoteVideos.length === 1 ? 'grid-cols-1' :
              remoteVideos.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
              'grid-cols-2 sm:grid-cols-3'
            }`}>
              {remoteVideos.map(({ peerId, participant }) => (
                <div key={peerId} className="relative bg-gray-800 rounded-xl overflow-hidden">
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(peerId, el);
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <span className="text-white text-sm font-medium">{participant.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full bg-gray-800 rounded-2xl flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">Waiting for others to join...</p>
                <p className="text-sm text-gray-400">Share the meeting link to invite participants</p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-32 h-24 sm:w-48 sm:h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm sm:text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm px-1 py-0.5 rounded text-xs text-white">
              You
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center space-x-4 mt-4 pb-safe">
          <button
            onClick={toggleAudio}
            className={`p-3 sm:p-4 rounded-full transition-all duration-200 ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 sm:p-4 rounded-full transition-all duration-200 ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={handleLeaveCall}
            className="p-3 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
            title="End call"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;