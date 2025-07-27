import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Badge,
  useTheme
} from '@mui/material';
import {
  LiveTv as LiveTvIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  TrendingUp as TrendingIcon,
  NearMe as NearMeIcon,
  Event as EventIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Chat as ChatIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Report as ReportIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const LivestreamCard = ({ livestream, onClick, onLike, onReport }) => {
  const theme = useTheme();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert':
        return <WarningIcon color="error" />;
      case 'event':
        return <EventIcon color="primary" />;
      case 'meeting':
        return <GroupIcon color="info" />;
      case 'sensitization':
        return <TrendingIcon color="secondary" />;
      case 'community':
        return <NearMeIcon color="success" />;
      default:
        return <VideocamIcon />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'alert':
        return 'Alerte';
      case 'event':
        return 'Événement';
      case 'meeting':
        return 'Réunion';
      case 'sensitization':
        return 'Sensibilisation';
      case 'community':
        return 'Communautaire';
      default:
        return 'Live';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'low':
        return 'Faible';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Élevée';
      case 'critical':
        return 'Critique';
      default:
        return 'Normale';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live':
        return <LiveTvIcon color="error" />;
      case 'scheduled':
        return <ScheduleIcon color="primary" />;
      case 'ended':
        return <VideocamOffIcon color="disabled" />;
      default:
        return <VideocamIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'error';
      case 'scheduled':
        return 'primary';
      case 'ended':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'live':
        return 'En direct';
      case 'scheduled':
        return 'Programmé';
      case 'ended':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: fr 
    });
  };

  const getLocationText = () => {
    const { location } = livestream;
    if (!location) return '';
    
    const parts = [];
    if (location.quartier) parts.push(location.quartier);
    if (location.commune) parts.push(location.commune);
    
    return parts.join(', ');
  };

  const getViewerCount = () => {
    return livestream.stats?.currentViewers || livestream.viewers?.length || 0;
  };

  const getMessageCount = () => {
    return livestream.stats?.totalMessages || livestream.messages?.length || 0;
  };

  const getReactionCount = () => {
    return livestream.reactions?.length || 0;
  };

  const isLiked = () => {
    // Vérifier si l'utilisateur actuel a liké ce live
    // Cette logique devrait être basée sur l'état Redux
    return false;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        }
      }}
      onClick={onClick}
    >
      {/* Image de couverture ou placeholder */}
      <CardMedia
        component="div"
        sx={{
          height: 140,
          backgroundColor: livestream.status === 'live' ? 'error.main' : 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {livestream.status === 'live' ? (
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <LiveTvIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              EN DIRECT
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <VideocamIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2">
              {livestream.status === 'scheduled' ? 'Programmé' : 'Terminé'}
            </Typography>
          </Box>
        )}
        
        {/* Badge de statut */}
        <Chip
          icon={getStatusIcon(livestream.status)}
          label={getStatusLabel(livestream.status)}
          color={getStatusColor(livestream.status)}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontWeight: 'bold'
          }}
        />
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* En-tête avec type et urgence */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Chip
            icon={getTypeIcon(livestream.type)}
            label={getTypeLabel(livestream.type)}
            size="small"
            variant="outlined"
          />
          {livestream.urgency && livestream.urgency !== 'medium' && (
            <Chip
              label={getUrgencyLabel(livestream.urgency)}
              color={getUrgencyColor(livestream.urgency)}
              size="small"
            />
          )}
        </Box>

        {/* Titre */}
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            lineHeight: 1.2,
            mb: 1
          }}
        >
          {livestream.title}
        </Typography>

        {/* Description */}
        {livestream.description && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {livestream.description}
          </Typography>
        )}

        {/* Localisation */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            {getLocationText()}
          </Typography>
        </Box>

        {/* Horodatage */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="caption" color="text.secondary">
            {livestream.status === 'live' && livestream.startedAt 
              ? `Démarré ${formatTime(livestream.startedAt)}`
              : livestream.status === 'scheduled' && livestream.scheduledAt
              ? `Programmé ${formatTime(livestream.scheduledAt)}`
              : livestream.status === 'ended' && livestream.endedAt
              ? `Terminé ${formatTime(livestream.endedAt)}`
              : formatTime(livestream.createdAt)
            }
          </Typography>
        </Box>

        {/* Auteur */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ width: 24, height: 24, mr: 1 }}
            src={livestream.author?.avatar}
          >
            <PersonIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {livestream.author?.firstName} {livestream.author?.lastName}
          </Typography>
        </Box>

        {/* Statistiques */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 'auto'
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Badge badgeContent={getViewerCount()} color="primary" max={999}>
              <GroupIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </Badge>
            <Badge badgeContent={getMessageCount()} color="secondary" max={999}>
              <ChatIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            </Badge>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                onLike && onLike(livestream._id);
              }}
              color={isLiked() ? 'error' : 'default'}
            >
              {isLiked() ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReport && onReport(livestream._id);
              }}
            >
              <ReportIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LivestreamCard; 