import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import { Person } from '@mui/icons-material';

const DefaultAvatar = ({ 
  user, 
  size = 40, 
  sx = {}, 
  showName = false,
  variant = 'circular'
}) => {
  const getInitials = (user) => {
    if (!user) return 'U';
    
    const firstName = user.firstName || user.name || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  const getBackgroundColor = (user) => {
    if (!user) return '#4CAF50';
    
    const name = (user.firstName || user.name || 'U').toLowerCase();
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
      '#F44336', '#00BCD4', '#795548', '#607D8B'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        variant={variant}
        sx={{
          width: size,
          height: size,
          bgcolor: getBackgroundColor(user),
          color: 'white',
          fontSize: size * 0.4,
          fontWeight: 'bold',
          ...sx
        }}
      >
        {user?.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt="Profile"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <Box sx={{ 
          display: user?.profilePicture ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}>
          {getInitials(user)}
        </Box>
      </Avatar>
      
      {showName && user && (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.name || 'Utilisateur'
          }
        </Typography>
      )}
    </Box>
  );
};

export default DefaultAvatar;