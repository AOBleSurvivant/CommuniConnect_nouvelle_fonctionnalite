import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  useTheme,
  IconButton,
  Tooltip,
  Fade,
  Grow,
} from '@mui/material';
import {
  Notifications,
  Event,
  Help,
  Map,
  TrendingUp,
  People,
  LocationOn,
  Security,
  Add,
  Visibility,
  Warning,
  CheckCircle,
  Schedule,
  Group,
  LocalFireDepartment,
  ElectricBolt,
  Construction,
  PersonSearch,
  VolumeUp,
  LocalHospital,
  Lock,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    alerts: 0,
    events: 0,
    helpRequests: 0,
    activeUsers: 0,
  });

  const [recentAlerts, setRecentAlerts] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    // TODO: Charger les statistiques et données récentes depuis l'API
    // Pour l'instant, on utilise des données fictives
    setStats({
      alerts: 5,
      events: 3,
      helpRequests: 8,
      activeUsers: 127,
    });

    setRecentAlerts([
      {
        id: 1,
        type: 'incendie',
        title: 'Incendie dans le quartier',
        location: 'Kaloum, Conakry',
        severity: 'critique',
        time: 'Il y a 2 heures',
        status: 'active',
      },
      {
        id: 2,
        type: 'coupure_electricite',
        title: 'Coupure d\'électricité',
        location: 'Dixinn, Conakry',
        severity: 'moderee',
        time: 'Il y a 4 heures',
        status: 'resolved',
      },
      {
        id: 3,
        type: 'route_bloquee',
        title: 'Route bloquée par travaux',
        location: 'Ratoma, Conakry',
        severity: 'faible',
        time: 'Il y a 6 heures',
        status: 'active',
      },
    ]);

    setUpcomingEvents([
      {
        id: 1,
        title: 'Réunion de quartier',
        date: '2024-01-15',
        time: '18:00',
        location: 'Centre communautaire',
        participants: 25,
        type: 'reunion',
      },
      {
        id: 2,
        title: 'Campagne de nettoyage',
        date: '2024-01-20',
        time: '08:00',
        location: 'Place du marché',
        participants: 15,
        type: 'nettoyage',
      },
      {
        id: 3,
        title: 'Formation premiers secours',
        date: '2024-01-25',
        time: '14:00',
        location: 'Mairie',
        participants: 30,
        type: 'formation',
      },
    ]);
  }, []);

  const getAlertIcon = (type) => {
    const icons = {
      incendie: <LocalFireDepartment />,
      coupure_electricite: <ElectricBolt />,
      route_bloquee: <Construction />,
      personne_disparue: <PersonSearch />,
      tapage_nocturne: <VolumeUp />,
      accident: <LocalHospital />,
      cambriolage: <Lock />,
    };
    return icons[type] || <Warning />;
  };

  const getAlertColor = (severity) => {
    const colors = {
      critique: 'error',
      moderee: 'warning',
      faible: 'info',
    };
    return colors[severity] || 'default';
  };

  const getEventIcon = (type) => {
    const icons = {
      reunion: <Group />,
      nettoyage: <Help />,
      formation: <Security />,
    };
    return icons[type] || <Event />;
  };

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Grow in timeout={800}>
      <Card 
        sx={{ 
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          '&:hover': onClick ? {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          } : {},
        }}
        onClick={onClick}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: `${color}.light`,
                color: `${color}.main`,
                mr: 2,
              }}
            >
              {icon}
            </Avatar>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </CardContent>
      </Card>
    </Grow>
  );

  const AlertCard = ({ alert }) => (
    <Fade in timeout={600}>
      <ListItem
        sx={{
          mb: 1,
          borderRadius: 2,
          backgroundColor: alert.status === 'resolved' 
            ? theme.palette.success.light + '10' 
            : theme.palette.background.paper,
          border: `1px solid ${alert.status === 'resolved' 
            ? theme.palette.success.light 
            : theme.palette.divider}`,
        }}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              bgcolor: `${getAlertColor(alert.severity)}.light`,
              color: `${getAlertColor(alert.severity)}.main`,
            }}
          >
            {getAlertIcon(alert.type)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {alert.title}
              </Typography>
              {alert.status === 'resolved' && (
                <Chip
                  icon={<CheckCircle />}
                  label="Résolu"
                  size="small"
                  color="success"
                />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary">
                <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                {alert.location}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {alert.time}
              </Typography>
            </Box>
          }
        />
        <Chip
          label={alert.severity}
          size="small"
          color={getAlertColor(alert.severity)}
          variant="outlined"
        />
      </ListItem>
    </Fade>
  );

  const EventCard = ({ event }) => (
    <Fade in timeout={600}>
      <ListItem
        sx={{
          mb: 1,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.main',
            }}
          >
            {getEventIcon(event.type)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="subtitle2" fontWeight="bold">
              {event.title}
            </Typography>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary">
                <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                {event.date} à {event.time}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                {event.location}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <People sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                {event.participants} participants
              </Typography>
            </Box>
          }
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<Visibility />}
          onClick={() => navigate('/events')}
        >
          Voir
        </Button>
      </ListItem>
    </Fade>
  );

  return (
    <Box sx={{ py: 3 }}>
      {/* En-tête de bienvenue */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Bienvenue sur CommuniConnect
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Connectons-nous pour renforcer notre communauté
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Restez informé des alertes, événements et demandes d'aide dans votre quartier
        </Typography>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Alertes actives"
            value={stats.alerts}
            icon={<Notifications />}
            color="error"
            onClick={() => navigate('/alerts')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Événements à venir"
            value={stats.events}
            icon={<Event />}
            color="primary"
            onClick={() => navigate('/events')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Demandes d'aide"
            value={stats.helpRequests}
            icon={<Help />}
            color="warning"
            onClick={() => navigate('/help')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utilisateurs actifs"
            value={stats.activeUsers}
            icon={<People />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Actions rapides
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Add />}
              onClick={() => navigate('/alerts/new')}
              sx={{ py: 1.5 }}
            >
              Créer une alerte
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Event />}
              onClick={() => navigate('/events/new')}
              sx={{ py: 1.5 }}
            >
              Créer un événement
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Help />}
              onClick={() => navigate('/help/new')}
              sx={{ py: 1.5 }}
            >
              Demander de l'aide
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Map />}
              onClick={() => navigate('/map')}
              sx={{ py: 1.5 }}
            >
              Voir la carte
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Contenu principal */}
      <Grid container spacing={4}>
        {/* Alertes récentes */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Alertes récentes
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/alerts')}
                  endIcon={<Visibility />}
                >
                  Voir tout
                </Button>
              </Box>
              <List>
                {recentAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Événements à venir */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Événements à venir
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/events')}
                  endIcon={<Visibility />}
                >
                  Voir tout
                </Button>
              </Box>
              <List>
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage; 