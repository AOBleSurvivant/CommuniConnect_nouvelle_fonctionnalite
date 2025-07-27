const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validateGuineanLocation } = require('../middleware/geographicValidation');

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
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom de famille doit contenir entre 2 et 50 caractères'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Veuillez entrer un email valide'),
  
  body('phone')
    .matches(/^(\+224|224)?[0-9]{8,9}$/)
    .withMessage('Veuillez entrer un numéro de téléphone guinéen valide'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  body('latitude')
    .isFloat({ min: 7.1935, max: 12.6769 })
    .withMessage('La latitude doit être dans les limites de la Guinée'),
  
  body('longitude')
    .isFloat({ min: -15.0820, max: -7.6411 })
    .withMessage('La longitude doit être dans les limites de la Guinée'),
], validateGuineanLocation, async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      quartier = 'Centre',
      address = 'Adresse par défaut',
      dateOfBirth = '1990-01-01',
      gender = 'Homme'
    } = req.body;

    // Utiliser les informations de localisation validées par le middleware
    const validatedLocation = req.validatedLocation;

    // En mode développement, créer un utilisateur fictif
    const user = {
      _id: crypto.randomBytes(16).toString('hex'),
      firstName,
      lastName,
      email,
      phone,
      region: validatedLocation.region,
      prefecture: validatedLocation.prefecture,
      commune: validatedLocation.commune,
      quartier,
      address,
      dateOfBirth,
      gender,
      coordinates: validatedLocation.coordinates,
      distanceFromCenter: validatedLocation.distance,
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

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès (mode développement)',
      token,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte',
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
      commune: 'Kaloum',
      quartier: 'Centre',
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
      commune: 'Kaloum',
      quartier: 'Centre',
      role: 'user',
      isVerified: true,
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

module.exports = router; 