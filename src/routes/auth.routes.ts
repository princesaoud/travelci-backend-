import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validateBody([
    body('full_name').trim().notEmpty().withMessage('Le nom complet est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('role').optional().isIn(['client', 'owner', 'admin']).withMessage('Rôle invalide'),
  ]),
  register
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  validateBody([
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Le mot de passe est requis'),
  ]),
  login
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, getMe);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, logout);

export default router;

