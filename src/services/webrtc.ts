export class WebRTCService {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private roomId: string;
  private displayName: string;
  private signalingServer: string = 'wss://api.peerjs.com/v1/peers';
  
  public onLocalStream?: (stream: MediaStream) => void;
  public onRemoteStream?: (stream: MediaStream) => void;
  public onConnectionStateChange?: (connected: boolean) => void;
  public onParticipantsChange?: (participants: string[]) => void;

  constructor(roomId: string, displayName: string) {
    this.roomId = roomId;
    this.displayName = displayName;
    
    // Create peer connection with STUN servers
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    // Handle incoming streams
    this.peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (this.onRemoteStream) {
        this.onRemoteStream(remoteStream);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const connected = this.peerConnection.connectionState === 'connected';
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(connected);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this to the signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };
  }

  async initialize() {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Notify about local stream
      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      // Simulate connection for demo purposes
      // In a real app, you'd connect to a signaling server here
      setTimeout(() => {
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(true);
        }
        if (this.onParticipantsChange) {
          this.onParticipantsChange([this.displayName]);
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  async createAnswer(offer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      throw error;
    }
  }

  disconnect() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Close peer connection
    this.peerConnection.close();
  }
}