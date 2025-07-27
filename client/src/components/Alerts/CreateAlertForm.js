import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  FormHelperText,
  useTheme,
  useMediaQuery,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  LocalFireDepartment as FireIcon,
  ElectricBolt as ElectricIcon,
  Construction as ConstructionIcon,
  PersonSearch as PersonIcon,
  VolumeUp as VolumeIcon,
  LocalHospital as HospitalIcon,
  Lock as LockIcon,
  PhotoCamera as PhotoIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';

const CreateAlertForm = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    severity: 'moderate',
    location: '',
    latitude: null,
    longitude: null,
    image: null,
    contactPhone: '',
    isForNeighbor: false,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error

  const alertTypes = [
    { value: 'incendie', label: 'Incendie', icon: <FireIcon />, color: 'error' },
    { value: 'coupure_electricite', label: 'Coupure d\'électricité', icon: <ElectricIcon />, color: 'warning' },
    { value: 'route_bloquee', label: 'Route bloquée', icon: <ConstructionIcon />, color: 'info' },
    { value: 'personne_disparue', label: 'Personne disparue', icon: <PersonIcon />, color: 'error' },
    { value: 'tapage_nocturne', label: 'Tapage nocturne', icon: <VolumeIcon />, color: 'warning' },
    { value: 'accident', label: 'Accident', icon: <HospitalIcon />, color: 'error' },
    { value: 'cambriolage', label: 'Cambriolage', icon: <LockIcon />, color: 'error' },
  ];

  const severityLevels = [
    { value: 'faible', label: 'Faible', color: 'success' },
    { value: 'moderate', label: 'Modérée', color: 'warning' },
    { value: 'critique', label: 'Critique', color: 'error' },
  ];

  useEffect(() => {
    if (open) {
      // Pré-remplir avec la localisation de l'utilisateur
      if (user?.location) {
        setFormData(prev => ({
          ...prev,
          location: `${user.location.quartier}, ${user.location.commune}`,
        }));
      }
    }
  }, [open, user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.type) {
      newErrors.type = 'Le type d\'alerte est requis';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La localisation est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleGetCurrentLocation = () => {
    setLocationStatus('loading');
    
    if (!navigator.geolocation) {
      setErrors(prev => ({ ...prev, location: 'La géolocalisation n\'est pas supportée' }));
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
        }));
        setLocationStatus('success');
        
        // Optionnel : géocoder les coordonnées pour obtenir l'adresse
        // reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        setErrors(prev => ({ 
          ...prev, 
          location: 'Impossible d\'obtenir votre localisation. Veuillez autoriser l\'accès.' 
        }));
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, image: 'L\'image est trop volumineuse (max 5MB)' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const alertData = {
        ...formData,
        author: user?.id,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      await onSubmit(alertData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: '',
        severity: 'moderate',
        location: '',
        latitude: null,
        longitude: null,
        image: null,
        contactPhone: '',
        isForNeighbor: false,
      });
      setErrors({});
      setLocationStatus('idle');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      setErrors(prev => ({ ...prev, submit: 'Erreur lors de la création de l\'alerte' }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        type: '',
        severity: 'moderate',
        location: '',
        latitude: null,
        longitude: null,
        image: null,
        contactPhone: '',
        isForNeighbor: false,
      });
      setErrors({});
      setLocationStatus('idle');
      onClose();
    }
  };

  const getTypeInfo = (type) => {
    return alertTypes.find(t => t.value === type) || {};
  };

  const getSeverityInfo = (severity) => {
    return severityLevels.find(s => s.value === severity) || {};
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="error" />
            <Typography variant="h6" fontWeight="bold">
              Créer une alerte
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Message d'erreur général */}
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Type d'alerte */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Type d'alerte *</InputLabel>
              <Select
                value={formData.type}
                onChange={handleInputChange('type')}
                label="Type d'alerte *"
              >
                {alertTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: `${type.color}.main` }}>
                        {type.icon}
                      </Box>
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Niveau de gravité */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Niveau de gravité</InputLabel>
              <Select
                value={formData.severity}
                onChange={handleInputChange('severity')}
                label="Niveau de gravité"
              >
                {severityLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={level.label}
                        size="small"
                        color={level.color}
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Titre */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Titre de l'alerte *"
              value={formData.title}
              onChange={handleInputChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              placeholder="Ex: Incendie dans le quartier"
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description détaillée *"
              value={formData.description}
              onChange={handleInputChange('description')}
              error={!!errors.description}
              helperText={errors.description}
              placeholder="Décrivez la situation en détail..."
            />
          </Grid>

          {/* Localisation */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Localisation
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Adresse ou lieu *"
                    value={formData.location}
                    onChange={handleInputChange('location')}
                    error={!!errors.location}
                    helperText={errors.location}
                    placeholder="Quartier, rue, points de repère..."
                    InputProps={{
                      startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={locationStatus === 'loading' ? <CircularProgress size={20} /> : <MyLocationIcon />}
                    onClick={handleGetCurrentLocation}
                    disabled={locationStatus === 'loading'}
                    sx={{ height: 56 }}
                  >
                    {locationStatus === 'loading' ? 'Localisation...' : 'Ma position'}
                  </Button>
                </Grid>
              </Grid>
              
              {/* Statut de géolocalisation */}
              {locationStatus === 'success' && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Position obtenue avec succès !
                </Alert>
              )}
              {locationStatus === 'error' && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Impossible d'obtenir votre position
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Informations supplémentaires */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Téléphone de contact"
              value={formData.contactPhone}
              onChange={handleInputChange('contactPhone')}
              placeholder="Numéro pour plus d'informations"
            />
          </Grid>

          {/* Upload d'image */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Photo ou document (optionnel)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="alert-image-upload"
                />
                <label htmlFor="alert-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoIcon />}
                  >
                    Ajouter une photo
                  </Button>
                </label>
                {formData.image && (
                  <Typography variant="body2" color="success.main">
                    ✓ Image sélectionnée
                  </Typography>
                )}
              </Box>
              {errors.image && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {errors.image}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          color="error"
          sx={{ px: 3 }}
        >
          {loading ? 'Création...' : 'Créer l\'alerte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAlertForm; 