// Generate a unique room ID
export const generateRoomId = (): string => {
  const adjectives = [
    'whisper', 'private', 'secret', 'quiet', 'silent', 'hidden', 
    'secure', 'safe', 'protected', 'intimate', 'personal', 'cozy',
    'peaceful', 'serene', 'calm', 'gentle', 'soft', 'subtle'
  ];
  
  const nouns = [
    'room', 'space', 'chamber', 'haven', 'sanctuary', 'retreat',
    'corner', 'nook', 'place', 'spot', 'zone', 'area',
    'vault', 'cabin', 'den', 'hub', 'nest', 'pod'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  
  return `${randomAdjective}-${randomNoun}-${randomNumber}`;
};

// Validate room ID format
export const isValidRoomId = (roomId: string): boolean => {
  const roomIdPattern = /^[a-z]+-[a-z]+-\d+$/;
  return roomIdPattern.test(roomId);
};

// Extract room info from room ID
export const parseRoomId = (roomId: string) => {
  const parts = roomId.split('-');
  if (parts.length === 3) {
    return {
      adjective: parts[0],
      noun: parts[1],
      number: parseInt(parts[2], 10),
      isValid: true
    };
  }
  return { isValid: false };
};