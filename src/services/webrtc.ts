import Peer, { DataConnection, MediaConnection } from 'peerjs';

export interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
}

export class WebRTCService {
  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private connections: Map<string, MediaConnection> = new Map();
  private dataConnections: Map<string, DataConnection> = new Map();
  private participants: Map<string, Participant> = new Map();
  private roomId: string;
  private displayName: string;
  private peerId: string;
  
  public onLocalStream?: (stream: MediaStream) => void;
  public onRemoteStream?: (peerId: string, stream: MediaStream, participant: Participant) => void;
  public onRemoteStreamRemoved?: (peerId: string) => void;
  public onConnectionStateChange?: (connected: boolean) => void;
  public onParticipantsChange?: (participants: Participant[]) => void;
  public onError?: (error: string) => void;

  constructor(roomId: string, displayName: string) {
    this.roomId = roomId;
    this.displayName = displayName;
    this.peerId = `${roomId}-${displayName}-${Date.now()}`;
  }

  async initialize(): Promise<void> {
    try {
      // Get user media first
      await this.getUserMedia();
      
      // Initialize PeerJS
      await this.initializePeer();
      
      // Join room
      this.joinRoom();
      
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      if (this.onError) {
        this.onError(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  private async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Camera and microphone access required');
    }
  }

  private async initializePeer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(this.peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log('Peer connected with ID:', id);
        resolve();
      });

      this.peer.on('error', (error) => {
        console.error('Peer error:', error);
        reject(error);
      });

      this.peer.on('call', (call) => {
        this.handleIncomingCall(call);
      });

      this.peer.on('connection', (conn) => {
        this.handleDataConnection(conn);
      });

      this.peer.on('disconnected', () => {
        console.log('Peer disconnected');
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(false);
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.peer && !this.peer.open) {
          reject(new Error('Failed to connect to signaling server'));
        }
      }, 10000);
    });
  }

  private joinRoom(): void {
    if (!this.peer) return;

    // Add self to participants
    this.participants.set(this.peerId, {
      id: this.peerId,
      name: this.displayName,
      stream: this.localStream || undefined
    });

    // Broadcast presence to room
    this.broadcastToRoom('join', {
      peerId: this.peerId,
      name: this.displayName,
      roomId: this.roomId
    });

    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(true);
    }

    this.updateParticipants();
  }

  private handleIncomingCall(call: MediaConnection): void {
    if (!this.localStream) {
      call.close();
      return;
    }

    // Answer the call with our stream
    call.answer(this.localStream);
    
    call.on('stream', (remoteStream) => {
      console.log('Received remote stream from:', call.peer);
      this.connections.set(call.peer, call);
      
      const participant = this.participants.get(call.peer);
      if (participant && this.onRemoteStream) {
        participant.stream = remoteStream;
        this.onRemoteStream(call.peer, remoteStream, participant);
      }
    });

    call.on('close', () => {
      console.log('Call closed:', call.peer);
      this.connections.delete(call.peer);
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(call.peer);
      }
    });

    call.on('error', (error) => {
      console.error('Call error:', error);
      this.connections.delete(call.peer);
    });
  }

  private handleDataConnection(conn: DataConnection): void {
    this.dataConnections.set(conn.peer, conn);

    conn.on('data', (data: any) => {
      this.handleDataMessage(conn.peer, data);
    });

    conn.on('close', () => {
      this.dataConnections.delete(conn.peer);
      this.participants.delete(conn.peer);
      this.updateParticipants();
    });
  }

  private handleDataMessage(fromPeer: string, data: any): void {
    switch (data.type) {
      case 'join':
        // Someone joined the room
        this.participants.set(fromPeer, {
          id: fromPeer,
          name: data.name
        });
        
        // Call them if we haven't already
        if (!this.connections.has(fromPeer) && this.localStream) {
          this.callPeer(fromPeer);
        }
        
        // Send our info back
        this.sendDataToPeer(fromPeer, 'join-response', {
          peerId: this.peerId,
          name: this.displayName
        });
        
        this.updateParticipants();
        break;
        
      case 'join-response':
        this.participants.set(fromPeer, {
          id: fromPeer,
          name: data.name
        });
        this.updateParticipants();
        break;
        
      case 'leave':
        this.participants.delete(fromPeer);
        this.connections.delete(fromPeer);
        if (this.onRemoteStreamRemoved) {
          this.onRemoteStreamRemoved(fromPeer);
        }
        this.updateParticipants();
        break;
    }
  }

  private callPeer(peerId: string): void {
    if (!this.peer || !this.localStream) return;

    const call = this.peer.call(peerId, this.localStream);
    
    call.on('stream', (remoteStream) => {
      console.log('Received stream from called peer:', peerId);
      this.connections.set(peerId, call);
      
      const participant = this.participants.get(peerId);
      if (participant && this.onRemoteStream) {
        participant.stream = remoteStream;
        this.onRemoteStream(peerId, remoteStream, participant);
      }
    });

    call.on('close', () => {
      this.connections.delete(peerId);
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(peerId);
      }
    });

    call.on('error', (error) => {
      console.error('Outgoing call error:', error);
      this.connections.delete(peerId);
    });
  }

  private broadcastToRoom(type: string, data: any): void {
    if (!this.peer) return;

    // In a real app, you'd use a signaling server to find room participants
    // For demo purposes, we'll try to connect to potential peers
    const roomPeers = this.generatePotentialPeerIds();
    
    roomPeers.forEach(peerId => {
      if (peerId !== this.peerId) {
        this.connectToPeer(peerId, type, data);
      }
    });
  }

  private generatePotentialPeerIds(): string[] {
    // Generate potential peer IDs for the room
    // In a real app, this would come from a signaling server
    const peers: string[] = [];
    const baseTime = Date.now();
    
    // Look for peers that might have joined in the last 5 minutes
    for (let i = 0; i < 10; i++) {
      const time = baseTime - (i * 30000); // 30 second intervals
      peers.push(`${this.roomId}-user-${time}`);
    }
    
    return peers;
  }

  private connectToPeer(peerId: string, type: string, data: any): void {
    if (!this.peer || this.dataConnections.has(peerId)) return;

    try {
      const conn = this.peer.connect(peerId);
      
      conn.on('open', () => {
        this.dataConnections.set(peerId, conn);
        conn.send({ type, ...data });
      });

      conn.on('data', (receivedData: any) => {
        this.handleDataMessage(peerId, receivedData);
      });

      conn.on('close', () => {
        this.dataConnections.delete(peerId);
      });

      conn.on('error', () => {
        // Peer doesn't exist or can't connect - this is normal
        this.dataConnections.delete(peerId);
      });
    } catch (error) {
      // Ignore connection errors - peer might not exist
    }
  }

  private sendDataToPeer(peerId: string, type: string, data: any): void {
    const conn = this.dataConnections.get(peerId);
    if (conn && conn.open) {
      conn.send({ type, ...data });
    }
  }

  private updateParticipants(): void {
    if (this.onParticipantsChange) {
      this.onParticipantsChange(Array.from(this.participants.values()));
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  disconnect(): void {
    // Notify others we're leaving
    this.broadcastToRoom('leave', { peerId: this.peerId });

    // Close all connections
    this.connections.forEach(call => call.close());
    this.dataConnections.forEach(conn => conn.close());
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer
    if (this.peer) {
      this.peer.destroy();
    }

    // Clear state
    this.connections.clear();
    this.dataConnections.clear();
    this.participants.clear();
    this.localStream = null;
    this.peer = null;
  }

  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  isConnected(): boolean {
    return this.peer?.open || false;
  }
}