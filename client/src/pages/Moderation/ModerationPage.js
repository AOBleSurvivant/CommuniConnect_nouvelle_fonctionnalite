import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  AdminPanelSettings,
  Warning,
  Block,
  CheckCircle,
  Delete,
  Edit,
  Visibility,
  Flag,
  Report,
  Person,
  Article as Post,
  Event,
  LiveTv,
  Notifications,
  Refresh,
  FilterList,
  Search,
  MoreVert,
  Close,
  Check,
  Clear,
  Archive,
  RestoreFromTrash,
  Security,
  Shield,
  Gavel,
  Analytics,
  TrendingUp,
  TrendingDown,
  People,
  Message,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ModerationPage = () => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [moderatedContent, setModeratedContent] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    activeUsers: 0,
    moderatedContent: 0,
    bannedUsers: 0,
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Données fictives pour la démonstration
  useEffect(() => {
    setLoading(true);
    
    // Simuler le chargement des données
    setTimeout(() => {
      setReports([
        {
          id: 1,
          type: 'post',
          content: {
            id: 'post1',
            title: 'Publication inappropriée',
            author: { name: 'Utilisateur A', avatar: null },
            content: 'Contenu signalé...',
            createdAt: new Date(Date.now() - 86400000),
          },
          reporter: { name: 'Utilisateur B', avatar: null },
          reason: 'inappropriate',
          description: 'Contenu inapproprié pour la communauté',
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000),
          priority: 'high',
        },
        {
          id: 2,
          type: 'alert',
          content: {
            id: 'alert1',
            title: 'Fausse alerte',
            author: { name: 'Utilisateur C', avatar: null },
            description: 'Alerte signalée comme fausse',
            createdAt: new Date(Date.now() - 172800000),
          },
          reporter: { name: 'Utilisateur D', avatar: null },
          reason: 'false_information',
          description: 'Cette alerte contient des informations erronées',
          status: 'resolved',
          createdAt: new Date(Date.now() - 7200000),
          priority: 'medium',
          resolution: 'alert_hidden',
        },
        {
          id: 3,
          type: 'user',
          content: {
            id: 'user1',
            name: 'Utilisateur E',
            email: 'user@example.com',
            role: 'user',
            status: 'active',
            createdAt: new Date(Date.now() - 259200000),
          },
          reporter: { name: 'Utilisateur F', avatar: null },
          reason: 'harassment',
          description: 'Comportement harcelant envers d\'autres utilisateurs',
          status: 'pending',
          createdAt: new Date(Date.now() - 1800000),
          priority: 'high',
        },
      ]);

      setModeratedContent([
        {
          id: 1,
          type: 'post',
          content: 'Publication supprimée',
          author: 'Utilisateur G',
          action: 'deleted',
          moderator: user?.firstName + ' ' + user?.lastName,
          reason: 'Contenu inapproprié',
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          id: 2,
          type: 'alert',
          content: 'Alerte masquée',
          author: 'Utilisateur H',
          action: 'hidden',
          moderator: user?.firstName + ' ' + user?.lastName,
          reason: 'Fausse information',
          createdAt: new Date(Date.now() - 172800000),
        },
      ]);

      setUsers([
        {
          id: 1,
          name: 'Utilisateur I',
          email: 'user1@example.com',
          role: 'user',
          status: 'active',
          reports: 0,
          posts: 15,
          joinedAt: new Date(Date.now() - 259200000),
        },
        {
          id: 2,
          name: 'Utilisateur J',
          email: 'user2@example.com',
          role: 'user',
          status: 'suspended',
          reports: 3,
          posts: 5,
          joinedAt: new Date(Date.now() - 518400000),
        },
      ]);

      setStats({
        totalReports: 15,
        pendingReports: 8,
        resolvedReports: 7,
        activeUsers: 127,
        moderatedContent: 23,
        bannedUsers: 3,
      });

      setLoading(false);
    }, 1000);
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleReportAction = (reportId, action, reason = '') => {
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          status: 'resolved',
          resolution: action,
          resolvedBy: user?.firstName + ' ' + user?.lastName,
          resolvedAt: new Date(),
          resolutionReason: reason,
        };
      }
      return report;
    }));

    setSnackbar({
      open: true,
      message: `Signalement ${action === 'approved' ? 'approuvé' : 'rejeté'} avec succès`,
      severity: 'success'
    });
  };

  const handleUserAction = (userId, action) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          status: action === 'ban' ? 'banned' : action === 'suspend' ? 'suspended' : 'active',
        };
      }
      return user;
    }));

    setSnackbar({
      open: true,
      message: `Utilisateur ${action === 'ban' ? 'banni' : action === 'suspend' ? 'suspendu' : 'réactivé'} avec succès`,
      severity: 'success'
    });
  };

  const openReportDialog = (report) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  const closeReportDialog = () => {
    setReportDialogOpen(false);
    setSelectedReport(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'resolved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      inappropriate: 'Inapproprié',
      spam: 'Spam',
      false_information: 'Fausse information',
      harassment: 'Harcèlement',
      other: 'Autre',
    };
    return reasons[reason] || reason;
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'post': return <Post />;
      case 'alert': return <Warning />;
      case 'event': return <Event />;
      case 'livestream': return <LiveTv />;
      case 'user': return <Person />;
      default: return <Message />;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement du tableau de bord de modération..." />;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* En-tête */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AdminPanelSettings sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Tableau de bord de modération
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez les signalements, le contenu et les utilisateurs de la communauté
            </Typography>
          </Box>
        </Box>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Flag color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.pendingReports}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Signalements en attente
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <People color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.activeUsers}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Utilisateurs actifs
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Shield color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.moderatedContent}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contenu modéré
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Block color="error" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.bannedUsers}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Utilisateurs bannis
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.resolvedReports}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Signalements résolus
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Analytics color="secondary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.totalReports}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total signalements
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Onglets */}
        <Paper sx={{ width: '100%' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab 
              label={
                <Badge badgeContent={stats.pendingReports} color="error">
                  Signalements
                </Badge>
              } 
              icon={<Flag />} 
              iconPosition="start"
            />
            <Tab label="Contenu modéré" icon={<Shield />} iconPosition="start" />
            <Tab label="Utilisateurs" icon={<People />} iconPosition="start" />
            <Tab label="Statistiques" icon={<Analytics />} iconPosition="start" />
          </Tabs>

          {/* Contenu des onglets */}
          <Box sx={{ p: 3 }}>
            {/* Onglet Signalements */}
            {activeTab === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Contenu</TableCell>
                      <TableCell>Signaleur</TableCell>
                      <TableCell>Raison</TableCell>
                      <TableCell>Priorité</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getContentTypeIcon(report.type)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {report.type.toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => openReportDialog(report)}
                          >
                            Voir le contenu
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                              {report.reporter.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">
                              {report.reporter.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getReasonLabel(report.reason)} 
                            size="small" 
                            color="warning"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={report.priority} 
                            size="small" 
                            color={getPriorityColor(report.priority)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={report.status === 'pending' ? 'En attente' : 'Résolu'} 
                            size="small" 
                            color={getStatusColor(report.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {report.status === 'pending' && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Approuver">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleReportAction(report.id, 'approved')}
                                >
                                  <Check />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rejeter">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReportAction(report.id, 'rejected')}
                                >
                                  <Clear />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Onglet Contenu modéré */}
            {activeTab === 1 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Contenu</TableCell>
                      <TableCell>Auteur</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Modérateur</TableCell>
                      <TableCell>Raison</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {moderatedContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getContentTypeIcon(item.type)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {item.type.toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{item.content}</TableCell>
                        <TableCell>{item.author}</TableCell>
                        <TableCell>
                          <Chip 
                            label={item.action === 'deleted' ? 'Supprimé' : 'Masqué'} 
                            size="small" 
                            color={item.action === 'deleted' ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{item.moderator}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Onglet Utilisateurs */}
            {activeTab === 2 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Utilisateur</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rôle</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Signalements</TableCell>
                      <TableCell>Publications</TableCell>
                      <TableCell>Inscrit le</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                              {user.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">
                              {user.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            size="small" 
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.status === 'active' ? 'Actif' : user.status === 'suspended' ? 'Suspendu' : 'Banni'} 
                            size="small" 
                            color={user.status === 'active' ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={user.reports} color="error">
                            <Flag />
                          </Badge>
                        </TableCell>
                        <TableCell>{user.posts}</TableCell>
                        <TableCell>
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {user.status === 'active' ? (
                              <>
                                <Tooltip title="Suspendre">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleUserAction(user.id, 'suspend')}
                                  >
                                    <Block />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Bannir">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleUserAction(user.id, 'ban')}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="Réactiver">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Onglet Statistiques */}
            {activeTab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Signalements par type" />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Graphiques et statistiques détaillées à venir...
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Actions de modération" />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Historique des actions de modération à venir...
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Dialog de détail du signalement */}
      <Dialog 
        open={reportDialogOpen} 
        onClose={closeReportDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  Détail du signalement #{selectedReport.id}
                </Typography>
                <IconButton onClick={closeReportDialog}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Contenu signalé
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      <strong>Auteur:</strong> {selectedReport.content.author?.name || selectedReport.content.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {selectedReport.type}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Contenu:</strong> {selectedReport.content.content || selectedReport.content.description || selectedReport.content.title}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {new Date(selectedReport.content.createdAt).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Informations du signalement
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      <strong>Signaleur:</strong> {selectedReport.reporter.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Raison:</strong> {getReasonLabel(selectedReport.reason)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Description:</strong> {selectedReport.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Priorité:</strong> {selectedReport.priority}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeReportDialog}>Fermer</Button>
              {selectedReport.status === 'pending' && (
                <>
                  <Button 
                    color="success" 
                    variant="contained"
                    onClick={() => {
                      handleReportAction(selectedReport.id, 'approved');
                      closeReportDialog();
                    }}
                  >
                    Approuver
                  </Button>
                  <Button 
                    color="error" 
                    variant="contained"
                    onClick={() => {
                      handleReportAction(selectedReport.id, 'rejected');
                      closeReportDialog();
                    }}
                  >
                    Rejeter
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ModerationPage; 