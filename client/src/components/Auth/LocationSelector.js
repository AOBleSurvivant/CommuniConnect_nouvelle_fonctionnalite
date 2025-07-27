import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Alert,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { LocationOn, MyLocation, CheckCircle, Warning } from '@mui/icons-material';

const LocationSelector = ({ formData, handleInputChange }) => {
  const [geographyData, setGeographyData] = useState(null);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [quartiers, setQuartiers] = useState([]);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const [suggestedLocation, setSuggestedLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  // Charger les données géographiques
  useEffect(() => {
    const loadGeographyData = async () => {
      try {
        console.log('Chargement des données géographiques...');
        const response = await fetch('/data/guinea-geography-complete.json');
        console.log('Réponse fetch:', response.status, response.ok);
        const data = await response.json();
        console.log('Données chargées:', data);
        console.log('Régions:', data.Guinée?.Régions);
        setGeographyData(data.Guinée?.Régions || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données géographiques:', error);
      }
    };
    loadGeographyData();
  }, []);

  // Fonction pour calculer la distance entre deux points GPS
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fonction pour trouver le quartier le plus proche
  const findNearestLocation = (userLat, userLng) => {
    let nearestLocation = null;
    let minDistance = Infinity;

    geographyData?.forEach(region => {
      region.préfectures?.forEach(prefecture => {
        prefecture.communes?.forEach(commune => {
          commune.quartiers?.forEach(quartier => {
            const distance = calculateDistance(
              userLat, userLng,
              quartier.coordonnées.latitude,
              quartier.coordonnées.longitude
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestLocation = {
                region: region.nom,
                prefecture: prefecture.nom,
                commune: commune.nom,
                quartier: quartier.nom,
                distance: distance
              };
            }
          });
        });
      });
    });

    return nearestLocation;
  };

  // Fonction pour détecter la position GPS
  const detectLocation = async () => {
    setLocationStatus('loading');
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur');
      setLocationStatus('error');
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Vérifier si l'utilisateur est en Guinée (approximativement)
      const isInGuinea = latitude >= 7.0 && latitude <= 12.5 && 
                        longitude >= -15.0 && longitude <= -7.5;
      
      if (!isInGuinea) {
        setLocationError('Vous devez être en Guinée pour utiliser cette fonctionnalité');
        setLocationStatus('error');
        return;
      }

      // Trouver le quartier le plus proche
      const nearest = findNearestLocation(latitude, longitude);
      
      if (nearest && nearest.distance <= 50) { // Dans un rayon de 50km
        setSuggestedLocation(nearest);
        setLocationStatus('success');
      } else {
        setLocationError('Aucun quartier trouvé à proximité. Veuillez sélectionner manuellement.');
        setLocationStatus('error');
      }

    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      setLocationError('Impossible de détecter votre position. Veuillez sélectionner manuellement.');
      setLocationStatus('error');
    }
  };

  // Appliquer la suggestion GPS
  const applyGPSLocation = () => {
    if (suggestedLocation) {
      handleInputChange({ target: { name: 'region', value: suggestedLocation.region } });
      handleInputChange({ target: { name: 'prefecture', value: suggestedLocation.prefecture } });
      handleInputChange({ target: { name: 'commune', value: suggestedLocation.commune } });
      handleInputChange({ target: { name: 'quartier', value: suggestedLocation.quartier } });
      
      // Mettre à jour les coordonnées GPS en cherchant dans les données géographiques
      let selectedQuartier = null;
      geographyData?.forEach(region => {
        if (region.nom === suggestedLocation.region) {
          region.préfectures?.forEach(prefecture => {
            if (prefecture.nom === suggestedLocation.prefecture) {
              prefecture.communes?.forEach(commune => {
                if (commune.nom === suggestedLocation.commune) {
                  commune.quartiers?.forEach(quartier => {
                    if (quartier.nom === suggestedLocation.quartier) {
                      selectedQuartier = quartier;
                    }
                  });
                }
              });
            }
          });
        }
      });
      
      if (selectedQuartier) {
        handleInputChange({ target: { name: 'latitude', value: selectedQuartier.coordonnées.latitude } });
        handleInputChange({ target: { name: 'longitude', value: selectedQuartier.coordonnées.longitude } });
      }
      
      // Suggérer une adresse complète basée sur la localisation
      const suggestedAddress = `${suggestedLocation.quartier}, ${suggestedLocation.commune}, ${suggestedLocation.prefecture}, ${suggestedLocation.region}, Guinée`;
      handleInputChange({ target: { name: 'address', value: suggestedAddress } });
    }
  };

  // Mettre à jour les préfectures quand la région change
  useEffect(() => {
    console.log('useEffect region - formData.region:', formData.region, 'geographyData:', geographyData);
    if (formData.region && geographyData) {
      const selectedRegion = geographyData.find(region => 
        region.nom.toLowerCase() === formData.region.toLowerCase()
      );
      console.log('Région sélectionnée:', selectedRegion);
      if (selectedRegion) {
        setPrefectures(selectedRegion.préfectures || []);
        // Réinitialiser les valeurs suivantes
        setCommunes([]);
        setQuartiers([]);
        handleInputChange({ target: { name: 'prefecture', value: '' } });
        handleInputChange({ target: { name: 'commune', value: '' } });
        handleInputChange({ target: { name: 'quartier', value: '' } });
        handleInputChange({ target: { name: 'latitude', value: '' } });
        handleInputChange({ target: { name: 'longitude', value: '' } });
      }
    }
  }, [formData.region, geographyData]);

  // Mettre à jour les communes quand la préfecture change
  useEffect(() => {
    console.log('useEffect prefecture - formData.prefecture:', formData.prefecture, 'prefectures:', prefectures);
    if (formData.prefecture && prefectures.length > 0) {
      const selectedPrefecture = prefectures.find(pref => 
        pref.nom.toLowerCase() === formData.prefecture.toLowerCase()
      );
      console.log('Préfecture sélectionnée:', selectedPrefecture);
      if (selectedPrefecture) {
        setCommunes(selectedPrefecture.communes || []);
        // Réinitialiser les valeurs suivantes
        setQuartiers([]);
        handleInputChange({ target: { name: 'commune', value: '' } });
        handleInputChange({ target: { name: 'quartier', value: '' } });
        handleInputChange({ target: { name: 'latitude', value: '' } });
        handleInputChange({ target: { name: 'longitude', value: '' } });
      }
    } else if (formData.prefecture && prefectures.length === 0) {
      // Si une préfecture est sélectionnée mais pas d'options disponibles, réinitialiser
      handleInputChange({ target: { name: 'prefecture', value: '' } });
    }
  }, [formData.prefecture, prefectures]);

  // Mettre à jour les quartiers quand la commune change
  useEffect(() => {
    console.log('useEffect commune - formData.commune:', formData.commune, 'communes:', communes);
    if (formData.commune && communes.length > 0) {
      const selectedCommune = communes.find(commune => 
        commune.nom.toLowerCase() === formData.commune.toLowerCase()
      );
      console.log('Commune sélectionnée:', selectedCommune);
      if (selectedCommune) {
        setQuartiers(selectedCommune.quartiers || []);
        // Réinitialiser les valeurs suivantes
        handleInputChange({ target: { name: 'quartier', value: '' } });
        handleInputChange({ target: { name: 'latitude', value: '' } });
        handleInputChange({ target: { name: 'longitude', value: '' } });
      }
    } else if (formData.commune && communes.length === 0) {
      // Si une commune est sélectionnée mais pas d'options disponibles, réinitialiser
      handleInputChange({ target: { name: 'commune', value: '' } });
    }
  }, [formData.commune, communes]);

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    console.log('handleLocationChange:', name, value);
    handleInputChange(e);
    
    // Mettre à jour les coordonnées GPS et l'adresse quand un quartier est sélectionné
    if (name === 'quartier') {
      const selectedQuartier = quartiers.find(q => q.nom === value);
      if (selectedQuartier) {
        console.log('Quartier sélectionné avec coordonnées:', selectedQuartier);
        handleInputChange({ target: { name: 'latitude', value: selectedQuartier.coordonnées.latitude } });
        handleInputChange({ target: { name: 'longitude', value: selectedQuartier.coordonnées.longitude } });
        
        // Générer l'adresse complète automatiquement
        const fullAddress = `${value}, ${formData.commune}, ${formData.prefecture}, ${formData.region}, Guinée`;
        handleInputChange({ target: { name: 'address', value: fullAddress } });
      }
    }
  };

  return (
    <Box>
      {/* Section géolocalisation GPS */}
      <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MyLocation color="primary" />
          Détection automatique de position
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Utilisez votre GPS pour détecter automatiquement votre position, proposer le quartier le plus proche et générer l'adresse complète.
        </Typography>

        <Button
          variant="outlined"
          startIcon={<MyLocation />}
          onClick={detectLocation}
          disabled={locationStatus === 'loading'}
          sx={{ mb: 2 }}
        >
          {locationStatus === 'loading' ? 'Détection en cours...' : 'Détecter ma position'}
        </Button>

        {/* Affichage du statut */}
        {locationStatus === 'success' && suggestedLocation && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography variant="body2">
                    Position détectée : <strong>{suggestedLocation.quartier}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {suggestedLocation.commune}, {suggestedLocation.prefecture}, {suggestedLocation.region}
                    {' '}(à {suggestedLocation.distance.toFixed(1)} km)
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  onClick={applyGPSLocation}
                  startIcon={<CheckCircle />}
                >
                  Appliquer tout
                </Button>
              </Box>
              
              {/* Aperçu de l'adresse suggérée */}
              <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Adresse suggérée :
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {suggestedLocation.quartier}, {suggestedLocation.commune}, {suggestedLocation.prefecture}, {suggestedLocation.region}, Guinée
                </Typography>
              </Box>
            </Box>
          </Alert>
        )}

        {locationStatus === 'error' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">{locationError}</Typography>
          </Alert>
        )}
      </Box>

      {/* Section sélection manuelle */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocationOn color="primary" />
        Sélection manuelle
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sélectionnez votre localisation étape par étape. L'adresse complète sera générée automatiquement quand vous choisissez votre quartier.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Région</InputLabel>
            <Select
              name="region"
              value={formData.region}
              onChange={handleLocationChange}
              label="Région"
              required
            >
              {geographyData?.map((region) => (
                <MenuItem key={region.nom} value={region.nom}>
                  {region.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Préfecture</InputLabel>
            <Select
              name="prefecture"
              value={formData.prefecture}
              onChange={handleLocationChange}
              label="Préfecture"
              required
              disabled={!formData.region}
            >
              {prefectures.map((prefecture) => (
                <MenuItem key={prefecture.nom} value={prefecture.nom}>
                  {prefecture.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Commune</InputLabel>
            <Select
              name="commune"
              value={formData.commune}
              onChange={handleLocationChange}
              label="Commune"
              required
              disabled={!formData.prefecture}
            >
              {communes.map((commune) => (
                <MenuItem key={commune.nom} value={commune.nom}>
                  {commune.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Quartier</InputLabel>
            <Select
              name="quartier"
              value={formData.quartier}
              onChange={handleLocationChange}
              label="Quartier"
              required
              disabled={!formData.commune}
            >
              {quartiers.map((quartier) => (
                <MenuItem key={quartier.nom} value={quartier.nom}>
                  {quartier.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Adresse complète"
            name="address"
            value={formData.address}
            onChange={handleLocationChange}
            multiline
            rows={3}
            placeholder="L'adresse se remplit automatiquement quand vous sélectionnez un quartier, ou vous pouvez la modifier manuellement"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn color="action" />
                </InputAdornment>
              ),
            }}
            helperText={formData.quartier ? "Adresse générée automatiquement - vous pouvez la modifier si nécessaire" : "Sélectionnez d'abord votre quartier pour générer l'adresse automatiquement"}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default LocationSelector; 