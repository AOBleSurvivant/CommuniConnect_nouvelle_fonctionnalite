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
  Switch,
  FormControlLabel,
  Slider,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  Group as GroupIcon,
  Celebration as CelebrationIcon,
  School as SchoolIcon,
  SportsEsports as SportsIcon,
  MusicNote as MusicIcon,
  Restaurant as FoodIcon,
  Business as BusinessIcon,
  VolunteerActivism as CharityIcon,
  PhotoCamera as PhotoIcon,
  MyLocation as MyLocationIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Euro as EuroIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

const CreateEventForm = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain par défaut
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
    location: '',
    latitude: null,
    longitude: null,
    maxParticipants: 50,
    isPublic: true,
    isFree: true,
    price: 0,
    image: null,
    contactPhone: '',
    contactEmail: '',
    tags: [],
    requirements: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [tagInput, setTagInput] = useState('');

  const eventTypes = [
    { value: 'celebration', label: 'Célébration', icon: <CelebrationIcon />, color: 'primary' },
    { value: 'education', label: 'Éducation', icon: <SchoolIcon />, color: 'info' },
    { value: 'sport', label: 'Sport', icon: <SportsIcon />, color: 'success' },
    { value: 'music', label: 'Musique', icon: <MusicIcon />, color: 'secondary' },
    { value: 'food', label: 'Gastronomie', icon: <FoodIcon />, color: 'warning' },
    { value: 'business', label: 'Business', icon: <BusinessIcon />, color: 'primary' },
    { value: 'charity', label: 'Charité', icon: <CharityIcon />, color: 'error' },
    { value: 'meeting', label: 'Réunion', icon: <GroupIcon />, color: 'info' },
  ];

  const visibilityOptions = [
    { value: true, label: 'Public', icon: <PublicIcon />, description: 'Visible par tous' },
    { value: false, label: 'Privé', icon: <PrivateIcon />, description: 'Sur invitation uniquement' },
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
      newErrors.type = 'Le type d\'événement est requis';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La localisation est requise';
    }

    if (formData.startDate <= new Date()) {
      newErrors.startDate = 'La date de début doit être dans le futur';
    }

    if (formData.endDate <= formData.startDate) {
      newErrors.endDate = 'La date de fin doit être après la date de début';
    }

    if (!formData.isFree && formData.price <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
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
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
    
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

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
    const eventData = {
      ...formData,
        organizer: user?.id,
        createdAt: new Date().toISOString(),
        status: 'upcoming',
        participants: [],
        interested: [],
      };

      await onSubmit(eventData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: '',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        location: '',
        latitude: null,
        longitude: null,
        maxParticipants: 50,
        isPublic: true,
        isFree: true,
        price: 0,
        image: null,
        contactPhone: '',
        contactEmail: '',
        tags: [],
        requirements: '',
      });
      setErrors({});
      setLocationStatus('idle');
      setTagInput('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      setErrors(prev => ({ ...prev, submit: 'Erreur lors de la création de l\'événement' }));
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
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        location: '',
        latitude: null,
        longitude: null,
        maxParticipants: 50,
        isPublic: true,
      isFree: true,
        price: 0,
        image: null,
        contactPhone: '',
        contactEmail: '',
        tags: [],
        requirements: '',
    });
    setErrors({});
      setLocationStatus('idle');
      setTagInput('');
    onClose();
    }
  };

  const getTypeInfo = (type) => {
    return eventTypes.find(t => t.value === type) || {};
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
            <EventIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Créer un événement
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

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          <Grid container spacing={3}>
            {/* Type d'événement */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Type d'événement *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleInputChange('type')}
                  label="Type d'événement *"
                >
                  {eventTypes.map((type) => (
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

            {/* Visibilité */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Visibilité</InputLabel>
                <Select
                  value={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.value }))}
                  label="Visibilité"
                >
                  {visibilityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        <Box>
                          <Typography variant="body2">{option.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
              </Typography>
                        </Box>
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
                label="Titre de l'événement *"
                value={formData.title}
                onChange={handleInputChange('title')}
                error={!!errors.title}
                helperText={errors.title}
                placeholder="Ex: Soirée culturelle guinéenne"
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
                placeholder="Décrivez votre événement en détail..."
              />
            </Grid>

            {/* Dates */}
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Date et heure de début *"
                value={formData.startDate}
                onChange={handleDateChange('startDate')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.startDate}
                    helperText={errors.startDate}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                )}
                minDateTime={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Date et heure de fin *"
                value={formData.endDate}
                onChange={handleDateChange('endDate')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.endDate}
                    helperText={errors.endDate}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                )}
                minDateTime={formData.startDate}
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

            {/* Participants et prix */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Nombre maximum de participants"
                value={formData.maxParticipants}
                onChange={handleInputChange('maxParticipants')}
                InputProps={{
                  startAdornment: <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFree}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      isFree: e.target.checked,
                      price: e.target.checked ? 0 : prev.price
                    }))}
                  />
                }
                label="Événement gratuit"
              />
            {!formData.isFree && (
                <TextField
                  fullWidth
                  type="number"
                  label="Prix (en GNF)"
                  value={formData.price}
                  onChange={handleInputChange('price')}
                  error={!!errors.price}
                  helperText={errors.price}
                  InputProps={{
                    startAdornment: <EuroIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ mt: 1 }}
                />
              )}
              </Grid>

            {/* Contact */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Téléphone de contact"
                value={formData.contactPhone}
                onChange={handleInputChange('contactPhone')}
                placeholder="Numéro pour plus d'informations"
              />
              </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email de contact"
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange('contactEmail')}
                placeholder="email@exemple.com"
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags (mots-clés)
                </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Ajouter un tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                >
                  Ajouter
                </Button>
              </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Exigences */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Exigences ou informations importantes"
                value={formData.requirements}
                onChange={handleInputChange('requirements')}
                placeholder="Ex: Tenue décontractée, apporter un plat à partager..."
              />
            </Grid>

            {/* Upload d'image */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Image de l'événement (optionnel)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="event-image-upload"
                  />
                  <label htmlFor="event-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoIcon />}
                    >
                      Ajouter une image
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
        </LocalizationProvider>
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
          color="primary"
          sx={{ px: 3 }}
        >
          {loading ? 'Création...' : 'Créer l\'événement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEventForm; 