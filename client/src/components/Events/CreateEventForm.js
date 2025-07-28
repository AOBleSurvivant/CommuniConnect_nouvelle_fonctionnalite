import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Alert,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Event,
  LocationOn,
  PhotoCamera,
  Send,
} from '@mui/icons-material';
import LocationSelector from '../common/LocationSelector';

const CreateEventForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    date: '',
    time: '',
    region: '',
    prefecture: '',
    commune: '',
    quartier: '',
    address: '',
    latitude: '',
    longitude: '',
    image: '',
    contactPhone: '',
    maxParticipants: ''
  });

  const [errors, setErrors] = useState({});

  const eventTypes = [
    { value: 'community', label: 'Communautaire', color: 'primary' },
    { value: 'cultural', label: 'Culturel', color: 'secondary' },
    { value: 'sports', label: 'Sport', color: 'success' },
    { value: 'educational', label: 'Éducatif', color: 'info' },
    { value: 'business', label: 'Business', color: 'warning' },
    { value: 'religious', label: 'Religieux', color: 'default' },
    { value: 'other', label: 'Autre', color: 'default' }
  ];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

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

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    if (!formData.time) {
      newErrors.time = 'L\'heure est requise';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La localisation est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (validateForm()) {
      // Formater les données selon le format attendu par l'API
      const formattedData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.type, // Utiliser le type comme catégorie par défaut
        startDate: new Date(formData.date).toISOString(),
        endDate: new Date(formData.date).toISOString(), // Même date pour l'instant
        startTime: formData.time,
        endTime: formData.time, // Même heure pour l'instant
        venue: formData.address,
        address: formData.address,
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
        capacity: parseInt(formData.maxParticipants) || null,
        isFree: true,
        price: { amount: 0, currency: 'GNF' },
        tags: [],
        location: {
          region: formData.region,
          prefecture: formData.prefecture,
          commune: formData.commune,
          quartier: formData.quartier,
          address: formData.address,
          coordinates: {
            latitude: parseFloat(formData.latitude) || null,
            longitude: parseFloat(formData.longitude) || null
          }
        },
        contactPhone: formData.contactPhone,
        image: formData.image
      };
      
      console.log('📤 Données formatées pour l\'API:', formattedData);
      onSubmit(formattedData);
    }
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

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Event color="primary" />
          Créer un événement
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informations de base */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations de l'événement
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre de l'événement *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={!!errors.title}
                helperText={errors.title}
                placeholder="Ex: Fête de quartier de Kaloum"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description détaillée *"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description}
                placeholder="Décrivez votre événement, le programme, les activités prévues..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Type d'événement *</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Type d'événement *"
                >
                  <MenuItem value="">
                    <em>Sélectionnez un type</em>
                  </MenuItem>
                  {eventTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={type.label} 
                          size="small" 
                          color={type.color} 
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && (
                  <Typography variant="caption" color="error">
                    {errors.type}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone de contact"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="Ex: 22412345678"
              />
            </Grid>

            {/* Date et heure */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date *"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                error={!!errors.date}
                helperText={errors.date}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure *"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                error={!!errors.time}
                helperText={errors.time}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre max de participants"
                name="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                placeholder="Ex: 100"
                InputProps={{
                  endAdornment: <InputAdornment position="end">personnes</InputAdornment>,
                }}
              />
            </Grid>

            {/* Localisation */}
            <Grid item xs={12}>
              <LocationSelector 
                formData={formData}
                handleInputChange={handleInputChange}
                showGPS={true}
                required={true}
              />
            </Grid>

            {/* Image optionnelle */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Image (optionnel)
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  sx={{ mb: 2 }}
                >
                  Ajouter une image
                </Button>
              </label>
              {formData.image && (
                <Box sx={{ mt: 2 }}>
                  <img 
                    src={formData.image} 
                    alt="Aperçu" 
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                  />
                </Box>
              )}
              {errors.image && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {errors.image}
                </Alert>
              )}
            </Grid>

            {/* Bouton de soumission */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={<Send />}
              >
                {loading ? 'Envoi en cours...' : 'Publier l\'événement'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateEventForm; 