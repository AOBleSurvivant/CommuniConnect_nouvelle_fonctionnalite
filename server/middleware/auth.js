const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      // En mode développement, permettre l'accès sans token pour les tests
      if (process.env.NODE_ENV === 'development') {
        req.user = {
          id: 'test-user-id',
          _id: 'test-user-id',
          firstName: 'Utilisateur',
          lastName: 'Test',
          email: 'test@example.com',
          phone: '22412345678',
          role: 'user',
          isVerified: true,
          isActive: true,
          location: {
            region: 'Conakry',
            prefecture: 'Conakry',
            commune: 'Kaloum',
            quartier: 'Centre',
            coordinates: {
              latitude: 9.537,
              longitude: -13.6785
            }
          }
        };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token requis.'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'communiconnect-dev-secret-key-2024-change-in-production');
      
      // En mode développement, créer un utilisateur fictif
      req.user = {
        id: decoded.id,
        _id: decoded.id,
        firstName: 'Utilisateur',
        lastName: 'Connecté',
        email: 'user@example.com',
        phone: '22412345678',
        role: 'user',
        isVerified: true,
        isActive: true,
        location: {
          region: 'Conakry',
          prefecture: 'Conakry',
          commune: 'Kaloum',
          quartier: 'Centre',
          coordinates: {
            latitude: 9.537,
            longitude: -13.6785
          }
        }
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
  } catch (error) {
    console.error('Erreur dans authMiddleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

// Middleware d'autorisation basé sur les rôles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Permissions insuffisantes.'
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur peut modérer
const canModerate = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }

  const moderatorRoles = ['moderator', 'admin'];
  if (!moderatorRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Rôle de modérateur requis.'
    });
  }

  next();
};

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Rôle d\'administrateur requis.'
    });
  }

  next();
};

// Middleware pour vérifier la propriété d'une ressource
const checkOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const resourceId = req.params.id;
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Ressource non trouvée'
        });
      }

      // Permettre aux modérateurs et admins d'accéder à toutes les ressources
      if (['moderator', 'admin'].includes(req.user.role)) {
        req.resource = resource;
        return next();
      }

      // Vérifier si l'utilisateur est le propriétaire
      if (resource.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette ressource.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Erreur dans checkOwnership:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de propriété'
      });
    }
  };
};

module.exports = {
  authMiddleware,
  authorize,
  canModerate,
  isAdmin,
  checkOwnership
}; 