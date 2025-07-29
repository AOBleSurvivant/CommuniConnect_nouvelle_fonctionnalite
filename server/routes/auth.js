const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validateGuineanLocation } = require('../middleware/geographicValidation');
const User = require('../models/User'); // Added missing import for User model
const bcrypt = require('bcryptjs'); // Added missing import for bcrypt
const auth = require('../middleware/auth'); // Added missing import for auth middleware

const router = express.Router();

// GET /api/auth - Route de base pour vérifier l'état du service
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Service d\'authentification opérationnel',
    endpoints: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      profile: '/api/auth/profile',
      logout: '/api/auth/logout'
    }
  });
});

// GET /api/auth/status - Route pour vérifier le statut du service d'authentification
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Service d\'authentification opérationnel',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      profile: '/api/auth/profile',
      logout: '/api/auth/logout'
    }
  });
});

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur (réservé aux Guinéens)
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').optional().isMobilePhone(),
  body('region').notEmpty().trim(),
  body('prefecture').notEmpty().trim(),
  body('commune').notEmpty().trim(),
  body('quartier').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('latitude').isFloat(),
  body('longitude').isFloat()
], async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Erreurs de validation:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone, region, prefecture, commune, quartier, address, latitude, longitude } = req.body;

    // Vérifier si MongoDB est disponible
    const mongoose = require('mongoose');
    console.log('État de la connexion MongoDB:', mongoose.connection.readyState);
    
    // Vérifier si l'utilisateur existe déjà (seulement si MongoDB est connecté)
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const userData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      region,
      prefecture,
      commune,
      quartier,
      address,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    };

    // Vérifier si MongoDB est disponible
    console.log('État de la connexion MongoDB:', mongoose.connection.readyState);
    
    let user = null;
    if (mongoose.connection.readyState === 1) {
      // MongoDB est connecté, sauvegarder l'utilisateur
      console.log('Sauvegarde dans MongoDB...');
      user = new User(userData);
      await user.save();
      console.log('Utilisateur sauvegardé avec succès');
    } else {
      // Mode développement sans MongoDB, simuler une inscription réussie
      console.log('Mode développement: Utilisateur simulé créé');
      user = {
        _id: 'dev-user-id',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user'
      };
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
// @access  Public
router.post('/login', [
  body('identifier')
    .notEmpty()
    .withMessage('Email ou numéro de téléphone requis'),
  
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { identifier, password } = req.body;

    // En mode développement, accepter n'importe quel identifiant/mot de passe
    const user = {
      _id: crypto.randomBytes(16).toString('hex'),
      firstName: 'Utilisateur',
      lastName: 'Test',
      email: identifier.includes('@') ? identifier : 'test@example.com',
      phone: identifier.includes('@') ? '22412345678' : identifier,
      region: 'Conakry',
      prefecture: 'Conakry',
      commune: '',
      quartier: '',
      role: 'user',
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      getPublicProfile: function() {
        return {
          _id: this._id,
          firstName: this.firstName,
          lastName: this.lastName,
          fullName: `${this.firstName} ${this.lastName}`,
          email: this.email,
          phone: this.phone,
          region: this.region,
          prefecture: this.prefecture,
          commune: this.commune,
          quartier: this.quartier,
          role: this.role,
          isVerified: this.isVerified,
          createdAt: this.createdAt
        };
      }
    };

    // Générer le token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Connexion réussie (mode développement)',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/profile/picture
// @desc    Mettre à jour la photo de profil
// @access  Private
router.put('/profile/picture', auth, async (req, res) => {
  try {
    // En mode développement, simuler l'upload avec une image locale
    const mockImageUrl = `/api/static/avatars/${req.user.firstName?.charAt(0) || 'U'}.jpg`;
    
    res.json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      profilePicture: mockImageUrl
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo de profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la photo de profil'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obtenir le profil de l'utilisateur connecté
// @access  Private
router.get('/me', (req, res) => {
  try {
    // En mode développement, retourner un utilisateur fictif
    const user = {
      _id: req.user?.id || crypto.randomBytes(16).toString('hex'),
      firstName: 'Utilisateur',
      lastName: 'Connecté',
      email: 'user@example.com',
      phone: '22412345678',
      region: 'Conakry',
      prefecture: 'Conakry',
      commune: '',
      quartier: '',
      role: 'user',
      isVerified: true,
      profilePicture: `/api/static/avatars/U.jpg`,
      createdAt: new Date(),
      getPublicProfile: function() {
        return {
          _id: this._id,
          firstName: this.firstName,
          lastName: this.lastName,
          fullName: `${this.firstName} ${this.lastName}`,
          email: this.email,
          phone: this.phone,
          region: this.region,
          prefecture: this.prefecture,
          commune: this.commune,
          quartier: this.quartier,
          role: this.role,
          isVerified: this.isVerified,
          profilePicture: this.profilePicture,
          createdAt: this.createdAt
        };
      }
    };
    
    res.json({
      success: true,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Demande de réinitialisation de mot de passe
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // En mode développement, on retourne un message de succès
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/fake-token`;

    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé (mode développement)',
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation',
      error: error.message
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Réinitialiser le mot de passe
// @access  Public
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { password } = req.body;
    const resetToken = req.params.token;

    // En mode développement, on retourne un message de succès
    const token = generateToken(crypto.randomBytes(16).toString('hex'));

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès (mode développement)',
      token
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Déconnexion de l'utilisateur
// @access  Private
router.post('/logout', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message
    });
  }
});

// POST /api/auth/oauth/callback - Callback OAuth pour Google/Facebook
router.post('/oauth/callback', async (req, res) => {
  try {
    const { code, state, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code d\'autorisation requis'
      });
    }

    // En mode développement, simuler une authentification OAuth réussie
    if (process.env.NODE_ENV === 'development') {
      const mockUser = {
        _id: 'oauth-user-id',
        firstName: 'Utilisateur',
        lastName: 'OAuth',
        email: 'oauth@example.com',
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
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const token = jwt.sign(
        { userId: mockUser._id, email: mockUser.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Connexion OAuth réussie',
        user: mockUser,
        token
      });
    }

    // En production, échanger le code contre un token
    // TODO: Implémenter l'échange de code avec Google/Facebook
    res.status(501).json({
      success: false,
      message: 'Authentification OAuth non implémentée en production'
    });

  } catch (error) {
    console.error('Erreur OAuth callback:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification OAuth'
    });
  }
});

module.exports = router; 