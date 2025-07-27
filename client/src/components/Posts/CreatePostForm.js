import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert
} from '@mui/material';
import {
  Send,
  Image,
  VideoLibrary,
  AttachFile,
  Close,
  Edit
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { createPost, updatePost, clearError, clearSuccess } from '../../store/slices/postsSlice';

const CreatePostForm = ({ open, onClose, editPost = null }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { loading, error, success } = useSelector(state => state.posts);

  const [formData, setFormData] = useState({
    content: '',
    type: 'community',
    location: {
      region: user?.region || 'Conakry',
      prefecture: user?.prefecture || 'Conakry',
      commune: user?.commune || 'Kaloum',
      quartier: user?.quartier || 'Centre',
      coordinates: user?.coordinates || { latitude: 9.5144, longitude: -13.6783 }
    },
    isPublic: true
  });

  const [mediaFiles, setMediaFiles] = useState([]);

  // Initialiser le formulaire avec les données du post à éditer
  useEffect(() => {
    if (editPost) {
      setFormData({
        content: editPost.content,
        type: editPost.type,
        location: editPost.location,
        isPublic: editPost.isPublic
      });
      setMediaFiles(editPost.media || []);
    } else {
      setFormData({
        content: '',
        type: 'community',
        location: {
          region: user?.region || 'Conakry',
          prefecture: user?.prefecture || 'Conakry',
          commune: user?.commune || 'Kaloum',
          quartier: user?.quartier || 'Centre',
          coordinates: user?.coordinates || { latitude: 9.5144, longitude: -13.6783 }
        },
        isPublic: true
      });
      setMediaFiles([]);
    }
  }, [editPost, user]);

  // Nettoyer les messages d'erreur/succès
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
    if (success) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success, dispatch]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      return;
    }

    const postData = {
      ...formData,
      media: mediaFiles
    };

    if (editPost) {
      await dispatch(updatePost({ id: editPost._id, postData }));
    } else {
      await dispatch(createPost(postData));
    }

    // Fermer le formulaire si succès
    if (!error) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      content: '',
      type: 'community',
      location: {
        region: user?.region || 'Conakry',
        prefecture: user?.prefecture || 'Conakry',
        commune: user?.commune || 'Kaloum',
        quartier: user?.quartier || 'Centre',
        coordinates: user?.coordinates || { latitude: 9.5144, longitude: -13.6783 }
      },
      isPublic: true
    });
    setMediaFiles([]);
    onClose();
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    // TODO: Implémenter l'upload de fichiers avec Cloudinary
    console.log('Fichiers sélectionnés:', files);
  };

  const removeMediaFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getTypeInfo = (type) => {
    const types = {
      community: { label: 'Communauté', color: 'primary' },
      alert: { label: 'Alerte', color: 'error' },
      event: { label: 'Événement', color: 'success' },
      help: { label: 'Aide', color: 'warning' },
      announcement: { label: 'Annonce', color: 'info' }
    };
    return types[type] || { label: 'Post', color: 'default' };
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {editPost ? 'Modifier le post' : 'Créer un nouveau post'}
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {/* Messages d'erreur/succès */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Type de post */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type de post</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              label="Type de post"
            >
              <MenuItem value="community">
                <Chip label="Communauté" color="primary" size="small" />
              </MenuItem>
              <MenuItem value="alert">
                <Chip label="Alerte" color="error" size="small" />
              </MenuItem>
              <MenuItem value="event">
                <Chip label="Événement" color="success" size="small" />
              </MenuItem>
              <MenuItem value="help">
                <Chip label="Aide" color="warning" size="small" />
              </MenuItem>
              <MenuItem value="announcement">
                <Chip label="Annonce" color="info" size="small" />
              </MenuItem>
            </Select>
          </FormControl>

          {/* Contenu du post */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Que voulez-vous partager ?"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Partagez vos pensées, questions, ou informations avec votre communauté..."
            sx={{ mb: 2 }}
            required
          />

          {/* Localisation */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Localisation
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Région"
                value={formData.location.region}
                onChange={(e) => handleInputChange('location.region', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Préfecture"
                value={formData.location.prefecture}
                onChange={(e) => handleInputChange('location.prefecture', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Commune"
                value={formData.location.commune}
                onChange={(e) => handleInputChange('location.commune', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quartier"
                value={formData.location.quartier}
                onChange={(e) => handleInputChange('location.quartier', e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>

          {/* Médias */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Ajouter des médias
            </Typography>
            <Box display="flex" gap={1}>
              <input
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Image />}
                  size="small"
                >
                  Images
                </Button>
              </label>

              <input
                accept="video/*"
                style={{ display: 'none' }}
                id="video-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
              />
              <label htmlFor="video-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<VideoLibrary />}
                  size="small"
                >
                  Vidéos
                </Button>
              </label>

              <input
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFile />}
                  size="small"
                >
                  Documents
                </Button>
              </label>
            </Box>

            {/* Aperçu des fichiers */}
            {mediaFiles.length > 0 && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Fichiers attachés ({mediaFiles.length})
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                  {mediaFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name || `Fichier ${index + 1}`}
                      onDelete={() => removeMediaFile(index)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Visibilité */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Visibilité</InputLabel>
            <Select
              value={formData.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.value)}
              label="Visibilité"
            >
              <MenuItem value={true}>Public</MenuItem>
              <MenuItem value={false}>Privé (amis uniquement)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Annuler
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.content.trim()}
          startIcon={editPost ? <Edit /> : <Send />}
        >
          {loading ? 'Envoi...' : (editPost ? 'Modifier' : 'Publier')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostForm; 