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
} from '@mui/material';
import { LocationOn, MyLocation, CheckCircle } from '@mui/icons-material';

const LocationSelector = ({ formData, handleInputChange, showGPS = true, required = true }) => {
  const [geographyData, setGeographyData] = useState(null);
  const [prefectures, setPrefectures] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [quartiers, setQuartiers] = useState([]);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [suggestedLocation, setSuggestedLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  // Charger les données géographiques
  useEffect(() => {
    const loadGeographyData = async () => {
      try {
        const response = await fetch('/data/guinea-geography-complete.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setGeographyData(data.Guinée?.Régions || []);
        console.log('Données géographiques chargées:', data.Guinée?.Régions?.length || 0, 'régions');
      } catch (error) {
        console.error('Erreur lors du chargement des données géographiques:', error);
        setLocationError('Impossible de charger les données géographiques. Veuillez saisir manuellement.');
      }
    };
    loadGeographyData();
  }, []);

  // Initialiser les données en cascade quand il y a déjà des valeurs
  useEffect(() => {
    console.log('🔍 useEffect cascade - geographyData:', geographyData?.length, 'formData.region:', formData.region);
    
    if (geographyData && formData.region) {
      const selectedRegion = geographyData.find(r => r.nom === formData.region);
      console.log('🔍 Région trouvée:', selectedRegion?.nom);
      
      if (selectedRegion) {
        setPrefectures(selectedRegion.préfectures || []);
        console.log('🔍 Préfectures chargées:', selectedRegion.préfectures?.length || 0);
        
        if (formData.prefecture) {
          const selectedPrefecture = selectedRegion.préfectures?.find(p => p.nom === formData.prefecture);
          console.log('🔍 Préfecture trouvée:', selectedPrefecture?.nom);
          
          if (selectedPrefecture) {
            setCommunes(selectedPrefecture.communes || []);
            console.log('🔍 Communes chargées:', selectedPrefecture.communes?.length || 0);
            
            if (formData.commune) {
              const selectedCommune = selectedPrefecture.communes?.find(c => c.nom === formData.commune);
              console.log('🔍 Commune trouvée:', selectedCommune?.nom);
              
              if (selectedCommune) {
                setQuartiers(selectedCommune.quartiers || []);
                console.log('🔍 Quartiers chargés:', selectedCommune.quartiers?.length || 0);
              } else {
                // Réinitialiser si la commune n'existe pas
                console.log('⚠️ Commune non trouvée, réinitialisation');
                handleInputChange({ target: { name: 'commune', value: '' } });
                handleInputChange({ target: { name: 'quartier', value: '' } });
              }
            }
          } else {
            // Réinitialiser si la préfecture n'existe pas
            console.log('⚠️ Préfecture non trouvée, réinitialisation');
            handleInputChange({ target: { name: 'prefecture', value: '' } });
            handleInputChange({ target: { name: 'commune', value: '' } });
            handleInputChange({ target: { name: 'quartier', value: '' } });
          }
        }
      } else {
        // Réinitialiser si la région n'existe pas
        console.log('⚠️ Région non trouvée, réinitialisation');
        handleInputChange({ target: { name: 'region', value: '' } });
        handleInputChange({ target: { name: 'prefecture', value: '' } });
        handleInputChange({ target: { name: 'commune', value: '' } });
        handleInputChange({ target: { name: 'quartier', value: '' } });
      }
    }
  }, [geographyData, formData.region, formData.prefecture, formData.commune]);

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
    if (!geographyData) return null;
    
    let nearestLocation = null;
    let minDistance = Infinity;

    geographyData.forEach(region => {
      region.préfectures?.forEach(prefecture => {
        prefecture.communes?.forEach(commune => {
          commune.quartiers?.forEach(quartier => {
            if (quartier.coordonnées) {
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
                  distance: distance,
                  coordinates: quartier.coordonnées
                };
              }
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
      
      // Vérifier si les coordonnées sont en Guinée (approximatif)
      const isInGuinea = latitude >= 7.0 && latitude <= 12.5 && 
                        longitude >= -15.0 && longitude <= -7.5;
      
      if (!isInGuinea) {
        setLocationError('Vous devez être en Guinée pour utiliser cette fonctionnalité');
        setLocationStatus('error');
        return;
      }

      const nearest = findNearestLocation(latitude, longitude);
      
      if (nearest) {
        setSuggestedLocation(nearest);
        setLocationStatus('success');
      } else {
        setLocationError('Impossible de déterminer votre position exacte. Veuillez saisir manuellement.');
        setLocationStatus('error');
      }
    } catch (error) {
      setLocationError('Erreur lors de la détection de position: ' + error.message);
      setLocationStatus('error');
    }
  };

  // Appliquer la position GPS suggérée
  const applyGPSLocation = () => {
    if (suggestedLocation) {
      // Mettre à jour les champs de localisation
      handleInputChange({ target: { name: 'region', value: suggestedLocation.region } });
      handleInputChange({ target: { name: 'prefecture', value: suggestedLocation.prefecture } });
      handleInputChange({ target: { name: 'commune', value: suggestedLocation.commune } });
      handleInputChange({ target: { name: 'quartier', value: suggestedLocation.quartier } });
      
      // Mettre à jour les coordonnées
      if (suggestedLocation.coordinates) {
        handleInputChange({ target: { name: 'latitude', value: suggestedLocation.coordinates.latitude } });
        handleInputChange({ target: { name: 'longitude', value: suggestedLocation.coordinates.longitude } });
      }
      
      // Générer l'adresse complète
      const suggestedAddress = `${suggestedLocation.quartier}, ${suggestedLocation.commune}, ${suggestedLocation.prefecture}, ${suggestedLocation.region}, Guinée`;
      handleInputChange({ target: { name: 'address', value: suggestedAddress } });
    }
  };

  // Gérer les changements de sélection en cascade
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    handleInputChange(e);
    
    // Mettre à jour les options en cascade
    if (name === 'region') {
      const selectedRegion = geographyData?.find(r => r.nom === value);
      if (selectedRegion) {
        setPrefectures(selectedRegion.préfectures || []);
        setCommunes([]);
        setQuartiers([]);
        handleInputChange({ target: { name: 'prefecture', value: '' } });
        handleInputChange({ target: { name: 'commune', value: '' } });
        handleInputChange({ target: { name: 'quartier', value: '' } });
      }
    } else if (name === 'prefecture') {
      const selectedPrefecture = prefectures.find(p => p.nom === value);
      if (selectedPrefecture) {
        setCommunes(selectedPrefecture.communes || []);
        setQuartiers([]);
        handleInputChange({ target: { name: 'commune', value: '' } });
        handleInputChange({ target: { name: 'quartier', value: '' } });
      }
    } else if (name === 'commune') {
      const selectedCommune = communes.find(c => c.nom === value);
      if (selectedCommune) {
        setQuartiers(selectedCommune.quartiers || []);
        handleInputChange({ target: { name: 'quartier', value: '' } });
      }
    } else if (name === 'quartier') {
      const selectedQuartier = quartiers.find(q => q.nom === value);
      if (selectedQuartier && selectedQuartier.coordonnées) {
        handleInputChange({ target: { name: 'latitude', value: selectedQuartier.coordonnées.latitude } });
        handleInputChange({ target: { name: 'longitude', value: selectedQuartier.coordonnées.longitude } });
        
        const fullAddress = `${value}, ${formData.commune}, ${formData.prefecture}, ${formData.region}, Guinée`;
        handleInputChange({ target: { name: 'address', value: fullAddress } });
      }
    }
  };

  return (
    <Box>
      {/* Section géolocalisation GPS */}
      {showGPS && (
        <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MyLocation color="primary" />
            Détection automatique de position
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Utilisez votre GPS pour détecter automatiquement votre position et remplir tous les champs de localisation.
          </Typography>

          <Button
            variant="outlined"
            onClick={detectLocation}
            disabled={locationStatus === 'loading'}
            startIcon={<MyLocation />}
            sx={{ mb: 2 }}
          >
            {locationStatus === 'loading' ? 'Détection en cours...' : 'Détecter ma position'}
          </Button>

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
      )}

      {/* Section sélection manuelle */}
      <Box sx={{ mb: 3 }}>
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
              <InputLabel>Région {required ? '*' : ''}</InputLabel>
              <Select
                name="region"
                value={formData.region || ''}
                onChange={handleLocationChange}
                label={`Région ${required ? '*' : ''}`}
                required={required}
              >
                <MenuItem value="">
                  <em>Sélectionnez une région</em>
                </MenuItem>
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
              <InputLabel>Préfecture {required ? '*' : ''}</InputLabel>
              <Select
                name="prefecture"
                value={formData.prefecture || ''}
                onChange={handleLocationChange}
                label={`Préfecture ${required ? '*' : ''}`}
                required={required}
                disabled={!formData.region}
              >
                <MenuItem value="">
                  <em>Sélectionnez une préfecture</em>
                </MenuItem>
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
              <InputLabel>Commune {required ? '*' : ''}</InputLabel>
              <Select
                name="commune"
                value={formData.commune || ''}
                onChange={handleLocationChange}
                label={`Commune ${required ? '*' : ''}`}
                required={required}
                disabled={!formData.prefecture}
              >
                <MenuItem value="">
                  <em>Sélectionnez une commune</em>
                </MenuItem>
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
              <InputLabel>Quartier {required ? '*' : ''}</InputLabel>
              <Select
                name="quartier"
                value={formData.quartier || ''}
                onChange={handleLocationChange}
                label={`Quartier ${required ? '*' : ''}`}
                required={required}
                disabled={!formData.commune}
              >
                <MenuItem value="">
                  <em>Sélectionnez un quartier</em>
                </MenuItem>
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
              value={formData.address || ''}
              onChange={handleInputChange}
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
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Latitude (optionnel)"
              name="latitude"
              type="number"
              value={formData.latitude || ''}
              onChange={handleInputChange}
              placeholder="Ex: 9.5370"
              InputProps={{
                endAdornment: <InputAdornment position="end">°</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Longitude (optionnel)"
              name="longitude"
              type="number"
              value={formData.longitude || ''}
              onChange={handleInputChange}
              placeholder="Ex: -13.6785"
              InputProps={{
                endAdornment: <InputAdornment position="end">°</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LocationSelector;