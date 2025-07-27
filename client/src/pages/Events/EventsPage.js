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
  Event,
  CheckCircle,
  Cancel,
  CalendarToday,
  Celebration,
  School,
  SportsEsports,
  MusicNote,
  Restaurant,
  Business,
  VolunteerActivism,
  Group,
  TrendingUp,
  LocationOn,
  Euro,
} from '@mui/icons-material';
import { formatError } from '../../utils/errorHandler';
import CreateEventForm from '../../components/Events/CreateEventForm';
import EventCard from '../../components/Events/EventCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EventsPage = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Données fictives pour la démonstration
  const mockEvents = [
    {
      id: 1,
      title: "Soirée culturelle guinéenne",
      description: "Une soirée exceptionnelle pour célébrer la culture guinéenne avec musique traditionnelle, danse et cuisine locale. Venez découvrir ou redécouvrir les richesses de notre patrimoine culturel.",
      type: "celebration",
      status: "upcoming",
      organizer: {
        id: 1,
        firstName: "Mariama",
        lastName: "Diallo",
        name: "Mariama Diallo",
        avatar: null,
      },
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // +4h
      location: "Centre culturel de Kaloum, Conakry",
      latitude: 9.5370,
      longitude: -13.6785,
      maxParticipants: 100,
      participants: [
        { user: { _id: 2, firstName: "Ibrahima" }, joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { user: { _id: 3, firstName: "Fatoumata" }, joinedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      ],
      interested: [],
      isPublic: true,
      isFree: true,
      price: 0,
      contactPhone: "+224 123 456 789",
      contactEmail: "mariama@exemple.com",
      tags: ["culture", "musique", "danse", "cuisine"],
      requirements: "Tenue traditionnelle recommandée",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "Formation en entrepreneuriat",
      description: "Formation gratuite sur les bases de l'entrepreneuriat pour les jeunes. Apprenez à créer et gérer votre propre entreprise avec des experts du domaine.",
      type: "education",
      status: "upcoming",
      organizer: {
        id: 2,
        firstName: "Ibrahima",
        lastName: "Keita",
        name: "Ibrahima Keita",
        avatar: null,
      },
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 1 semaine
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // +6h
      location: "Université de Conakry, Dixinn",
      latitude: 9.5370,
      longitude: -13.6785,
      maxParticipants: 50,
      participants: [
        { user: { _id: 1, firstName: "Mariama" }, joinedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
        { user: { _id: 4, firstName: "Aissatou" }, joinedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        { user: { _id: 5, firstName: "Ousmane" }, joinedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      ],
      interested: [],
      isPublic: true,
      isFree: true,
      price: 0,
      contactPhone: "+224 987 654 321",
      contactEmail: "ibrahima@exemple.com",
      tags: ["formation", "entrepreneuriat", "jeunesse", "gratuit"],
      requirements: "Apporter un carnet et un stylo",
    },
    {
      id: 3,
      title: "Tournoi de football de quartier",
      description: "Tournoi amical de football entre les quartiers de Ratoma. Inscription gratuite, récompenses pour les gagnants. Venez soutenir votre équipe !",
      type: "sport",
      status: "upcoming",
      organizer: {
        id: 3,
        firstName: "Fatoumata",
        lastName: "Camara",
        name: "Fatoumata Camara",
        avatar: null,
      },
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // +8h
      location: "Terrain de football de Ratoma",
      latitude: 9.5370,
      longitude: -13.6785,
      maxParticipants: 80,
      participants: [
        { user: { _id: 1, firstName: "Mariama" }, joinedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        { user: { _id: 2, firstName: "Ibrahima" }, joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      ],
      interested: [],
      isPublic: true,
      isFree: true,
      price: 0,
      contactPhone: "+224 555 123 456",
      contactEmail: "fatoumata@exemple.com",
      tags: ["football", "sport", "tournoi", "quartier"],
      requirements: "Tenue de sport, chaussures de football",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    },
    {
      id: 4,
      title: "Concert de musique traditionnelle",
      description: "Concert exceptionnel de musique traditionnelle guinéenne avec des artistes locaux. Une soirée magique pour découvrir les sons authentiques de la Guinée.",
      type: "music",
      status: "upcoming",
      organizer: {
        id: 4,
        firstName: "Aissatou",
        lastName: "Barry",
        name: "Aissatou Barry",
        avatar: null,
      },
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3h
      location: "Salle de spectacle de Matam",
      latitude: 9.5370,
      longitude: -13.6785,
      maxParticipants: 200,
      participants: [
        { user: { _id: 1, firstName: "Mariama" }, joinedAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        { user: { _id: 3, firstName: "Fatoumata" }, joinedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        { user: { _id: 5, firstName: "Ousmane" }, joinedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      ],
      interested: [],
      isPublic: true,
      isFree: false,
      price: 5000,
      contactPhone: "+224 777 888 999",
      contactEmail: "aissatou@exemple.com",
      tags: ["musique", "traditionnel", "concert", "artistes"],
      requirements: "Tenue correcte exigée",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    },
    {
      id: 5,
      title: "Dégustation de cuisine locale",
      description: "Découvrez les saveurs authentiques de la cuisine guinéenne avec nos chefs locaux. Dégustation de plats traditionnels et échange culinaire.",
      type: "food",
      status: "upcoming",
      organizer: {
        id: 5,
        firstName: "Ousmane",
        lastName: "Diallo",
        name: "Ousmane Diallo",
        avatar: null,
      },
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Demain
      endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2h
      location: "Restaurant Le Gourmet, Almamya",
      latitude: 9.5370,
      longitude: -13.6785,
      maxParticipants: 30,
      participants: [
        { user: { _id: 1, firstName: "Mariama" }, joinedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        { user: { _id: 2, firstName: "Ibrahima" }, joinedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
      ],
      interested: [],
      isPublic: true,
      isFree: false,
      price: 2500,
      contactPhone: "+224 666 777 888",
      contactEmail: "ousmane@exemple.com",
      tags: ["cuisine", "dégustation", "local", "gastronomie"],
      requirements: "Appétit et curiosité culinaire",
    },
  ];

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateEvent = (eventData) => {
    const newEvent = {
      id: Date.now(),
      ...eventData,
      organizer: {
        id: 1, // ID de l'utilisateur connecté
        firstName: "Vous",
        lastName: "",
        name: "Vous",
        avatar: null,
      },
      status: 'upcoming',
      participants: [],
      interested: [],
    };

    setEvents(prev => [newEvent, ...prev]);
    setShowCreateEvent(false);
    setSnackbar({
      open: true,
      message: 'Événement créé avec succès !',
      severity: 'success'
    });
  };

  const handleJoin = (eventId) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          participants: [
            ...event.participants,
            {
              user: { _id: 1, firstName: "Vous" },
              joinedAt: new Date()
            }
          ]
        };
      }
      return event;
    }));

    setSnackbar({
      open: true,
      message: 'Vous participez maintenant à cet événement !',
      severity: 'success'
    });
  };

  const handleLeave = (eventId) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          participants: event.participants.filter(p => p.user._id !== 1)
        };
      }
      return event;
    }));

    setSnackbar({
      open: true,
      message: 'Vous vous êtes désinscrit de cet événement',
      severity: 'info'
    });
  };

  const handleEdit = (event) => {
    // TODO: Implémenter l'édition
    setSnackbar({
      open: true,
      message: 'Fonctionnalité d\'édition à venir',
      severity: 'info'
    });
  };

  const handleDelete = (eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setSnackbar({
      open: true,
      message: 'Événement supprimé',
      severity: 'success'
    });
  };

  const handleReport = (eventId) => {
    // TODO: Implémenter le signalement
    setSnackbar({
      open: true,
      message: 'Événement signalé aux modérateurs',
      severity: 'warning'
    });
  };

  const handleShare = (event) => {
    // TODO: Implémenter le partage
    setSnackbar({
      open: true,
      message: 'Événement partagé !',
      severity: 'info'
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getFilteredEvents = () => {
    const now = new Date();

    switch (activeTab) {
      case 0: // Tous
        return events;
      case 1: // À venir
        return events.filter(event => new Date(event.startDate) > now);
      case 2: // En cours
        return events.filter(event =>
          new Date(event.startDate) <= now && new Date(event.endDate) >= now
        );
      case 3: // Terminés
        return events.filter(event => new Date(event.endDate) < now);
      case 4: // Gratuits
        return events.filter(event => event.isFree);
      default:
        return events;
    }
  };

  const tabLabels = [
    { label: 'Tous', icon: <FilterList /> },
    { label: 'À venir', icon: <CalendarToday /> },
    { label: 'En cours', icon: <Event /> },
    { label: 'Terminés', icon: <CheckCircle /> },
    { label: 'Gratuits', icon: <Euro /> },
  ];

  const getEventTypeStats = () => {
    const stats = {};
    events.forEach(event => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });
    return stats;
  };

  const eventTypeStats = getEventTypeStats();

  if (loading) {
    return <LoadingSpinner message="Chargement des événements..." />;
  }

  return (
    <Box sx={{ py: 3 }}>
        {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Événements Communautaires
          </Typography>
        <Typography variant="body1" color="text.secondary">
          Découvrez et participez aux événements de votre communauté
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

          {/* Liste des événements */}
          <Box>
            {getFilteredEvents().map((event, index) => (
              <Grow in timeout={800 + index * 100} key={event.id}>
                <Box>
                  <EventCard
                    event={event}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReport={handleReport}
                    onShare={handleShare}
                  />
                </Box>
              </Grow>
            ))}
          </Box>

          {/* Message si aucun événement */}
          {getFilteredEvents().length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun événement trouvé
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeTab === 0
                  ? 'Aucun événement n\'a été créé pour le moment.'
                  : 'Aucun événement ne correspond aux filtres sélectionnés.'
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
                    Événements à venir
                  </Typography>
                  <Chip
                    label={events.filter(e => new Date(e.startDate) > new Date()).length}
                    size="small"
                    color="primary"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Événements gratuits
                  </Typography>
                  <Chip
                    label={events.filter(e => e.isFree).length}
                    size="small"
                    color="success"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total participants
                  </Typography>
                  <Chip
                    label={events.reduce((sum, e) => sum + (e.participants?.length || 0), 0)}
                    size="small"
                    color="info"
                  />
                </Box>
              </Box>
            </Paper>

            {/* Types d'événements */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Types d'événements
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(eventTypeStats).map(([type, count]) => (
                  <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type === 'celebration' && <Celebration color="primary" />}
                      {type === 'education' && <School color="info" />}
                      {type === 'sport' && <SportsEsports color="success" />}
                      {type === 'music' && <MusicNote color="secondary" />}
                      {type === 'food' && <Restaurant color="warning" />}
                      {type === 'business' && <Business color="primary" />}
                      {type === 'charity' && <VolunteerActivism color="error" />}
                      {type === 'meeting' && <Group color="info" />}
                      <Typography variant="body2" textTransform="capitalize">
                        {type.replace('_', ' ')}
                      </Typography>
                    </Box>
                    <Chip label={count} size="small" />
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Événements populaires */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Événements populaires
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {events
                  .sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0))
                  .slice(0, 3)
                  .map((event) => (
                    <Box key={event.id} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {event.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.participants?.length || 0} participants
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Paper>
      </Box>
        </Grid>
      </Grid>

      {/* Bouton flottant pour créer un événement */}
      <Fab
        color="primary"
        aria-label="créer événement"
        onClick={() => setShowCreateEvent(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Add />
      </Fab>

      {/* Formulaire de création d'événement */}
      <CreateEventForm 
        open={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSubmit={handleCreateEvent}
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

export default EventsPage; 