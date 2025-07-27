import React, { useState, useEffect } from 'react';
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
  FormHelperText,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Videocam as VideocamIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  Group as GroupIcon,
  TrendingUp as TrendingIcon,
  NearMe as NearMeIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { createLivestream, clearError, clearSuccess } from '../../store/slices/livestreamsSlice';
// import { getGuineaGeography } from '../../store/slices/mapSlice';

const CreateLivestreamForm = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  
  const { user } = useSelector(state => state.auth);
  const { geography } = useSelector(state => state.map);
  const { loading, error, success } = useSelector(state => state.livestreams);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    urgency: 'medium',
    visibility: 'quartier',
    scheduledAt: '',
    region: '',
    prefecture: '',
    commune: '',
    quartier: ''
  });

  const [errors, setErrors] = useState({});
  const [locationStatus, setLocationStatus] = useState('idle');

  // Charger les données géographiques
  // useEffect(() => {
  //   if (!geography) {
  //     dispatch(getGuineaGeography());
  //   }
  // }, [dispatch, geography]);

  // Pré-remplir la localisation de l'utilisateur
  useEffect(() => {
    if (user?.location) {
      setFormData(prev => ({
        ...prev,
        region: user.location.region || '',
        prefecture: user.location.prefecture || '',
        commune: user.location.commune || '',
        quartier: user.location.quartier || ''
      }));
    }
  }, [user]);

  // Nettoyer les messages d'erreur/succès
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
        handleClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, success, dispatch]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length > 80) {
      newErrors.title = 'Le titre ne peut pas dépasser 80 caractères';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    if (!formData.type) {
      newErrors.type = 'Le type de live est requis';
    }

    if (!formData.region) {
      newErrors.region = 'La région est requise';
    }

    if (!formData.prefecture) {
      newErrors.prefecture = 'La préfecture est requise';
    }

    if (!formData.commune) {
      newErrors.commune = 'La commune est requise';
    }

    if (!formData.quartier) {
      newErrors.quartier = 'Le quartier est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
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

    // Mettre à jour les champs dépendants pour la géographie
    if (field === 'region') {
      setFormData(prev => ({
        ...prev,
        prefecture: '',
        commune: '',
        quartier: ''
      }));
    } else if (field === 'prefecture') {
      setFormData(prev => ({
        ...prev,
        commune: '',
        quartier: ''
      }));
    } else if (field === 'commune') {
      setFormData(prev => ({
        ...prev,
        quartier: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const livestreamData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      urgency: formData.urgency,
      visibility: formData.visibility,
      location: {
        region: formData.region,
        prefecture: formData.prefecture,
        commune: formData.commune,
        quartier: formData.quartier
      }
    };

    // Ajouter la planification si spécifiée
    if (formData.scheduledAt) {
      livestreamData.scheduledAt = new Date(formData.scheduledAt).toISOString();
    }

    dispatch(createLivestream(livestreamData));
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        type: '',
        urgency: 'medium',
        visibility: 'quartier',
        scheduledAt: '',
        region: '',
        prefecture: '',
        commune: '',
        quartier: ''
      });
      setErrors({});
      onClose();
    }
  };

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

  const getTypeDescription = (type) => {
    switch (type) {
      case 'alert':
        return 'Alerte urgente (incendie, accident, etc.)';
      case 'event':
        return 'Événement local (fête, cérémonie, etc.)';
      case 'meeting':
        return 'Réunion de quartier ou communautaire';
      case 'sensitization':
        return 'Session de sensibilisation citoyenne';
      case 'community':
        return 'Activité communautaire générale';
      default:
        return '';
    }
  };

  const getPrefectures = () => {
    if (!geography || !formData.region) return [];
    const region = geography.regions.find(r => r.name === formData.region);
    return region ? region.prefectures : [];
  };

  const getCommunes = () => {
    const prefectures = getPrefectures();
    if (!formData.prefecture) return [];
    const prefecture = prefectures.find(p => p.name === formData.prefecture);
    return prefecture ? prefecture.communes : [];
  };

  const getQuartiers = () => {
    const communes = getCommunes();
    if (!formData.commune) return [];
    const commune = communes.find(c => c.name === formData.commune);
    return commune ? commune.quartiers : [];
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          minHeight: isMobile ? '100vh' : 'auto'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2" fontWeight="bold">
            Créer un Live Communautaire
          </Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pb: 1 }}>
          {/* Messages d'erreur/succès */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Informations de base */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Informations de base
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre du live *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title || `${formData.title.length}/80 caractères`}
                placeholder="Ex: Réunion de quartier - Propreté"
                inputProps={{ maxLength: 80 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (optionnelle)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description || `${formData.description.length}/200 caractères`}
                placeholder="Description courte du live..."
                multiline
                rows={3}
                inputProps={{ maxLength: 200 }}
              />
            </Grid>

            {/* Type et urgence */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Type de live *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="Type de live *"
                >
                  <MenuItem value="alert">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="error" />
                      Alerte
                    </Box>
                  </MenuItem>
                  <MenuItem value="event">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon color="primary" />
                      Événement
                    </Box>
                  </MenuItem>
                  <MenuItem value="meeting">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon color="info" />
                      Réunion
                    </Box>
                  </MenuItem>
                  <MenuItem value="sensitization">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingIcon color="secondary" />
                      Sensibilisation
                    </Box>
                  </MenuItem>
                  <MenuItem value="community">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NearMeIcon color="success" />
                      Communautaire
                    </Box>
                  </MenuItem>
                </Select>
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Niveau d'urgence</InputLabel>
                <Select
                  value={formData.urgency}
                  onChange={(e) => handleInputChange('urgency', e.target.value)}
                  label="Niveau d'urgence"
                >
                  <MenuItem value="low">Faible</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="high">Élevée</MenuItem>
                  <MenuItem value="critical">Critique</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Description du type sélectionné */}
            {formData.type && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'grey.200'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getTypeIcon(formData.type)}
                    <Typography variant="subtitle2" fontWeight="bold">
                      {formData.type === 'alert' ? 'Alerte' :
                       formData.type === 'event' ? 'Événement' :
                       formData.type === 'meeting' ? 'Réunion' :
                       formData.type === 'sensitization' ? 'Sensibilisation' :
                       'Communautaire'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {getTypeDescription(formData.type)}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Planification */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Planification
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Programmer pour plus tard (optionnel)"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Laissez vide pour démarrer immédiatement"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Visibilité</InputLabel>
                <Select
                  value={formData.visibility}
                  onChange={(e) => handleInputChange('visibility', e.target.value)}
                  label="Visibilité"
                >
                  <MenuItem value="quartier">Quartier uniquement</MenuItem>
                  <MenuItem value="commune">Toute la commune</MenuItem>
                  <MenuItem value="prefecture">Toute la préfecture</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Localisation */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                Localisation
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.region}>
                <InputLabel>Région *</InputLabel>
                <Select
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  label="Région *"
                >
                  {geography?.regions?.map((region) => (
                    <MenuItem key={region.name} value={region.name}>
                      {region.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.region && <FormHelperText>{errors.region}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.prefecture}>
                <InputLabel>Préfecture *</InputLabel>
                <Select
                  value={formData.prefecture}
                  onChange={(e) => handleInputChange('prefecture', e.target.value)}
                  label="Préfecture *"
                  disabled={!formData.region}
                >
                  {getPrefectures().map((prefecture) => (
                    <MenuItem key={prefecture.name} value={prefecture.name}>
                      {prefecture.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.prefecture && <FormHelperText>{errors.prefecture}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.commune}>
                <InputLabel>Commune *</InputLabel>
                <Select
                  value={formData.commune}
                  onChange={(e) => handleInputChange('commune', e.target.value)}
                  label="Commune *"
                  disabled={!formData.prefecture}
                >
                  {getCommunes().map((commune) => (
                    <MenuItem key={commune.name} value={commune.name}>
                      {commune.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.commune && <FormHelperText>{errors.commune}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.quartier}>
                <InputLabel>Quartier *</InputLabel>
                <Select
                  value={formData.quartier}
                  onChange={(e) => handleInputChange('quartier', e.target.value)}
                  label="Quartier *"
                  disabled={!formData.commune}
                >
                  {getQuartiers().map((quartier) => (
                    <MenuItem key={quartier} value={quartier}>
                      {quartier}
                    </MenuItem>
                  ))}
                </Select>
                {errors.quartier && <FormHelperText>{errors.quartier}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Création...' : 'Créer le Live'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateLivestreamForm; 