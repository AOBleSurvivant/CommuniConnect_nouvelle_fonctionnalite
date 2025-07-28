import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Avatar,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  Fullscreen as FullscreenIcon,
  Chat as ChatIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

const LivestreamPlayer = ({ livestream, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const videoRef = useRef(null);
  const chatRef = useRef(null);
  
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();

  // Simuler des messages de chat en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      const mockMessages = [
        { id: Date.now(), user: 'Mamadou', message: 'Bonjour tout le monde !', timestamp: new Date() },
        { id: Date.now() + 1, user: 'Fatou', message: 'Merci pour ce live !', timestamp: new Date() },
        { id: Date.now() + 2, user: 'Ibrahima', message: 'Très intéressant !', timestamp: new Date() }
      ];
      setChatMessages(prev => [...prev, ...mockMessages.slice(0, 1)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll du chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleSendChatMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        user: user?.firstName || 'Utilisateur',
        message: chatMessage.trim(),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendChatMessage();
    }
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'black',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
        <Box sx={{ 
          display: 'flex',
        justifyContent: 'space-between', 
          alignItems: 'center',
        p: 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white'
      }}>
            <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {livestream.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {livestream.author?.firstName} {livestream.author?.lastName}
              </Typography>
            </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
        </Box>

        {/* Contenu principal */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Lecteur vidéo */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            poster="/api/livestreams/placeholder.jpg"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={livestream.streamUrl || '/api/livestreams/mock-stream.mp4'} type="video/mp4" />
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>

            {/* Contrôles vidéo */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              p: 2,
              display: 'flex',
              alignItems: 'center',
            gap: 2
          }}>
            <IconButton onClick={handlePlayPause} sx={{ color: 'white' }}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            
            <IconButton onClick={handleMute} sx={{ color: 'white' }}>
              {isMuted ? <MuteIcon /> : <VolumeIcon />}
                </IconButton>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              style={{ width: 100 }}
            />
            
            <IconButton onClick={handleFullscreen} sx={{ color: 'white', ml: 'auto' }}>
              <FullscreenIcon />
                </IconButton>
              </Box>

          {/* Statistiques en direct */}
          <Box sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            p: 1,
            borderRadius: 1
          }}>
            <Typography variant="caption">
              👥 {livestream.stats?.currentViewers || 0} spectateurs
            </Typography>
          </Box>
          </Box>

        {/* Chat en direct */}
          {showChat && (
          <Box sx={{ 
            width: 300, 
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Header du chat */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" sx={{ color: 'white' }}>
                💬 Chat en direct
                </Typography>
              <IconButton 
                size="small" 
                onClick={() => setShowChat(false)}
                sx={{ color: 'white' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              </Box>

              {/* Messages */}
              <Box 
                ref={chatRef}
                sx={{ 
                  flex: 1, 
                  overflowY: 'auto',
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              {chatMessages.map((msg) => (
                <Box key={msg.id} sx={{ display: 'flex', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                    {msg.user.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {msg.user}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                      {msg.message}
                    </Typography>
                  </Box>
                </Box>
              ))}
                </Box>

            {/* Input du chat */}
            <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                  placeholder="Tapez votre message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: 'white' }
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255,255,255,0.7)'
                    }
                  }}
                />
                        <IconButton 
                  onClick={handleSendChatMessage}
                  disabled={!chatMessage.trim()}
                  sx={{ color: 'white' }}
                        >
                          <SendIcon />
                        </IconButton>
              </Box>
              </Box>
            </Box>
          )}

        {/* Bouton pour afficher le chat */}
        {!showChat && (
            <IconButton
            onClick={() => setShowChat(true)}
              sx={{ 
              position: 'absolute',
              top: 16,
              right: 16,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
              }}
            >
              <ChatIcon />
            </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default LivestreamPlayer; 