import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Box,
  Grid,
  Chip,
  CircularProgress
} from '@mui/material';
import { LocationOn, CheckCircle, Error } from '@mui/icons-material';

const GeographicValidation = () => {
  const [locationStatus, setLocationStatus] = useState('idle');
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState('');

  const testLocation = () => {
    setLocationStatus('loading');
    setError('');

    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });
        
        // Vérifier si les coordonnées sont en Guinée
        const isInGuinea = checkIfInGuinea(latitude, longitude);
        
        if (isInGuinea) {
          setLocationStatus('success');
        } else {
          setError('Votre localisation ne se trouve pas en Guinée');
          setLocationStatus('error');
        }
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        setError('Impossible d\'obtenir votre localisation');
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const checkIfInGuinea = (latitude, longitude) => {
    // Limites approximatives de la Guinée
    const guineaBounds = {
      north: 12.6769,
      south: 7.1935,
      east: -7.6411,
      west: -15.0820
    };

    return (
      latitude >= guineaBounds.south &&
      latitude <= guineaBounds.north &&
      longitude >= guineaBounds.west &&
      longitude <= guineaBounds.east
    );
  };

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case 'loading':
        return <CircularProgress size={20} />;
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <LocationOn />;
    }
  };

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'loading':
        return 'Vérification de votre localisation...';
      case 'success':
        return 'Localisation en Guinée confirmée !';
      case 'error':
        return 'Localisation non autorisée';
      default:
        return 'Cliquez pour vérifier votre localisation';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
          Test de Validation Géographique
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Ce test vérifie si votre localisation actuelle se trouve en Guinée.
        </Typography>

        <Box display="flex" alignItems="center" mb={2}>
          <Button
            variant="contained"
            onClick={testLocation}
            disabled={locationStatus === 'loading'}
            startIcon={getLocationStatusIcon()}
            sx={{ mr: 2 }}
          >
            {getLocationStatusText()}
          </Button>
          
          {locationStatus === 'success' && (
            <Chip 
              label="Éligible" 
              color="success" 
              variant="outlined"
              icon={<CheckCircle />}
            />
          )}
          
          {locationStatus === 'error' && (
            <Chip 
              label="Non éligible" 
              color="error" 
              variant="outlined"
              icon={<Error />}
            />
          )}
        </Box>

        {coordinates && (
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Latitude: {coordinates.latitude.toFixed(6)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Longitude: {coordinates.longitude.toFixed(6)}
              </Typography>
            </Grid>
          </Grid>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {locationStatus === 'success' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Félicitations ! Vous êtes éligible pour créer un compte CommuniConnect.
              Votre localisation en Guinée a été confirmée.
            </Typography>
          </Alert>
        )}

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            <strong>Note :</strong> CommuniConnect est réservé aux résidents de la Guinée.
            Votre localisation sera vérifiée lors de l'inscription.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GeographicValidation; 