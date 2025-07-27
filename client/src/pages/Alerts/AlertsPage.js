import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid,
  Typography, 
  Paper,
  Tabs,
  Tab,
  Chip,
  Button, 
  useTheme,
  Fade,
  Grow,
  Alert,
  Snackbar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import { 
  Add,
  FilterList,
  Warning,
  CheckCircle,
  Cancel,
  Visibility,
  LocalFireDepartment,
  ElectricBolt,
  Construction,
  PersonSearch,
  VolumeUp,
  LocalHospital,
  Lock,
} from '@mui/icons-material';
import { formatError } from '../../utils/errorHandler';
import CreateAlertForm from '../../components/Alerts/CreateAlertForm';
import AlertCard from '../../components/Alerts/AlertCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AlertsPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Données fictives pour la démonstration
  const mockAlerts = [
    {
      id: 1,
      title: "Incendie dans le quartier de Kaloum",
      description: "Un incendie s'est déclaré dans un bâtiment commercial. Les pompiers sont sur place. Évitez la zone.",
      type: "incendie",
      severity: "critique",
      status: "active",
      author: {
        id: 1,
        name: "Mariama Diallo",
        avatar: null,
      },
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30 minutes
      location: "Kaloum, Conakry",
      latitude: 9.5370,
      longitude: -13.6785,
      contactPhone: "+224 123 456 789",
      image: "https://images.unsplash.com/photo-1566041510639-8d95a2490bfb?w=400&h=300&fit=crop",
      updates: [
        {
          message: "Les pompiers sont arrivés sur place",
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
        },
        {
          message: "L'incendie est maîtrisé",
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
        },
      ],
    },
    {
      id: 2,
      title: "Coupure d'électricité prolongée",
      description: "Pas d'électricité depuis 2 heures dans le secteur. EDG annonce une réparation dans la soirée.",
      type: "coupure_electricite",
      severity: "moderate",
      status: "active",
      author: {
        id: 2,
        name: "Ibrahima Keita",
        avatar: null,
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2 heures
      location: "Dixinn, Conakry",
      latitude: 9.5370,
      longitude: -13.6785,
      contactPhone: "+224 987 654 321",
    },
    {
      id: 3,
      title: "Route bloquée par un camion",
      description: "Un camion s'est renversé sur la route principale. Circulation très ralentie.",
      type: "route_bloquee",
      severity: "moderate",
      status: "resolved",
      author: {
        id: 3,
        name: "Fatoumata Camara",
        avatar: null,
      },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Il y a 4 heures
      location: "Ratoma, Conakry",
      latitude: 9.5370,
      longitude: -13.6785,
      updates: [
        {
          message: "Le camion a été dégagé",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
      ],
    },
    {
      id: 4,
      title: "Personne disparue - Enfant de 8 ans",
      description: "Mon fils de 8 ans a disparu hier soir. Il porte un t-shirt bleu et un pantalon noir.",
      type: "personne_disparue",
      severity: "critique",
      status: "active",
      author: {
        id: 4,
        name: "Aissatou Barry",
        avatar: null,
      },
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // Il y a 12 heures
      location: "Matam, Conakry",
      latitude: 9.5370,
      longitude: -13.6785,
      contactPhone: "+224 555 123 456",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    },
    {
      id: 5,
      title: "Tapage nocturne répété",
      description: "Musique très forte tous les soirs après 23h. Déjà signalé plusieurs fois.",
      type: "tapage_nocturne",
      severity: "faible",
      status: "investigating",
      author: {
        id: 5,
        name: "Ousmane Diallo",
        avatar: null,
      },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // Il y a 6 heures
      location: "Almamya, Conakry",
      latitude: 9.5370,
      longitude: -13.6785,
    },
  ];

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setAlerts(mockAlerts);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateAlert = (alertData) => {
    const newAlert = {
      id: Date.now(),
      ...alertData,
      author: {
        id: 1, // ID de l'utilisateur connecté
        name: "Vous",
        avatar: null,
      },
      status: 'active',
      updates: [],
    };

    setAlerts(prev => [newAlert, ...prev]);
    setShowCreateAlert(false);
    setSnackbar({
      open: true,
      message: 'Alerte créée avec succès !',
      severity: 'success'
    });
  };

  const handleStatusChange = (alertId, newStatus) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        return {
          ...alert,
          status: newStatus,
          updates: [
            ...alert.updates,
            {
              message: `Statut changé en "${newStatus}"`,
              timestamp: new Date(),
            },
          ],
        };
      }
      return alert;
    }));

    setSnackbar({
      open: true,
      message: 'Statut de l\'alerte mis à jour',
      severity: 'success'
    });
  };

  const handleEdit = (alert) => {
    // TODO: Implémenter l'édition
    setSnackbar({
      open: true,
      message: 'Fonctionnalité d\'édition à venir',
      severity: 'info'
    });
  };

  const handleDelete = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setSnackbar({
      open: true,
      message: 'Alerte supprimée',
      severity: 'success'
    });
  };

  const handleReport = (alertId) => {
    // TODO: Implémenter le signalement
    setSnackbar({
      open: true,
      message: 'Alerte signalée aux modérateurs',
      severity: 'warning'
    });
  };

  const handleShare = (alert) => {
    // TODO: Implémenter le partage
    setSnackbar({
      open: true,
      message: 'Alerte partagée !',
      severity: 'info'
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getFilteredAlerts = () => {
    switch (activeTab) {
      case 0: // Toutes
        return alerts;
      case 1: // Actives
        return alerts.filter(alert => alert.status === 'active');
      case 2: // Résolues
        return alerts.filter(alert => alert.status === 'resolved');
      case 3: // Critiques
        return alerts.filter(alert => alert.severity === 'critique');
      default:
        return alerts;
    }
  };

  const tabLabels = [
    { label: 'Toutes', icon: <FilterList /> },
    { label: 'Actives', icon: <Warning /> },
    { label: 'Résolues', icon: <CheckCircle /> },
    { label: 'Critiques', icon: <LocalFireDepartment /> },
  ];

  const getAlertTypeStats = () => {
    const stats = {};
    alerts.forEach(alert => {
      stats[alert.type] = (stats[alert.type] || 0) + 1;
    });
    return stats;
  };

  const alertTypeStats = getAlertTypeStats();

  if (loading) {
    return <LoadingSpinner message="Chargement des alertes..." />;
  }

  return (
    <Box sx={{ py: 3 }}>
        {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Alertes Communautaires
          </Typography>
        <Typography variant="body1" color="text.secondary">
          Restez informé des situations importantes dans votre communauté
        </Typography>
        </Box>

      {/* Message d'erreur */}
      {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
          {formatError(error)}
          </Alert>
        )}

      <Grid container spacing={3}>
        {/* Colonne principale */}
        <Grid item xs={12} lg={8}>
        {/* Filtres */}
          <Paper sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  textTransform: 'none',
                  fontWeight: 500,
                },
              }}
              >
              {tabLabels.map((tab, index) => (
                <Tab
                  key={index}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tab.icon}
                      {tab.label}
            </Box>
                  }
                />
              ))}
            </Tabs>
          </Paper>

          {/* Liste des alertes */}
          <Box>
            {getFilteredAlerts().map((alert, index) => (
              <Grow in timeout={800 + index * 100} key={alert.id}>
                <Box>
                  <AlertCard
                    alert={alert}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReport={handleReport}
                    onShare={handleShare}
                  />
                </Box>
              </Grow>
            ))}
          </Box>

          {/* Message si aucune alerte */}
          {getFilteredAlerts().length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Aucune alerte trouvée
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                {activeTab === 0
                  ? 'Aucune alerte n\'a été signalée pour le moment.'
                  : 'Aucune alerte ne correspond aux filtres sélectionnés.'
                }
                    </Typography>
            </Paper>
          )}
              </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            {/* Statistiques */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Statistiques
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Alertes actives
                  </Typography>
                  <Chip
                    label={alerts.filter(a => a.status === 'active').length}
                    size="small"
                    color="error"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Alertes critiques
                  </Typography>
                  <Chip
                    label={alerts.filter(a => a.severity === 'critique').length}
                    size="small"
                    color="error"
                  />
                        </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Résolues aujourd'hui
                          </Typography>
                          <Chip 
                    label={alerts.filter(a => a.status === 'resolved').length}
                            size="small"
                    color="success"
                          />
                        </Box>
                      </Box>
            </Paper>

            {/* Types d'alertes */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Types d'alertes
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(alertTypeStats).map(([type, count]) => (
                  <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type === 'incendie' && <LocalFireDepartment color="error" />}
                      {type === 'coupure_electricite' && <ElectricBolt color="warning" />}
                      {type === 'route_bloquee' && <Construction color="info" />}
                      {type === 'personne_disparue' && <PersonSearch color="error" />}
                      {type === 'tapage_nocturne' && <VolumeUp color="warning" />}
                      {type === 'accident' && <LocalHospital color="error" />}
                      {type === 'cambriolage' && <Lock color="error" />}
                      <Typography variant="body2" textTransform="capitalize">
                        {type.replace('_', ' ')}
                        </Typography>
                      </Box>
                    <Chip label={count} size="small" />
                      </Box>
                ))}
                      </Box>
            </Paper>
                      </Box>
                </Grid>
          </Grid>

      {/* Bouton flottant pour créer une alerte */}
      <Fab
        color="error"
        aria-label="créer alerte"
        onClick={() => setShowCreateAlert(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Add />
              </Fab>

        {/* Formulaire de création d'alerte */}
        <CreateAlertForm 
        open={showCreateAlert}
        onClose={() => setShowCreateAlert(false)}
        onSubmit={handleCreateAlert}
        />

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AlertsPage; 