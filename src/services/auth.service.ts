import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { SupabaseService } from './supabase.service';
import { User, CreateUserInput, UserResponse } from '../models/User.model';
import { NotFoundException, ValidationException, UnauthorizedException, BusinessRuleException, InfrastructureException } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Auth service for authentication and authorization
 */
export class AuthService extends SupabaseService {
  private readonly saltRounds = 10;

  /**
   * Register a new user
   */
  async register(input: CreateUserInput): Promise<{ user: UserResponse; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.executeQueryNullable<User>(
        async () =>
          await this.client
            .from('users')
            .select('*')
            .eq('email', input.email)
            .single()
      );

      if (existingUser) {
        throw new ValidationException('Un utilisateur avec cet email existe déjà');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, this.saltRounds);

      // Create user
      const user = await this.executeQuery<User>(
        async () =>
          await this.client
            .from('users')
            .insert({
              full_name: input.full_name,
              email: input.email,
              phone: input.phone,
              password_hash: passwordHash,
              role: input.role || 'client',
              is_verified: false,
            })
            .select()
            .single()
      );

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Remove sensitive data
      const { password_hash, ...userResponse } = user;

      return {
        user: userResponse as UserResponse,
        token,
      };
    } catch (error: any) {
      if (error instanceof ValidationException) {
        throw error;
      }
      logger.error('Registration error', { error: error.message, email: input.email });
      throw new BusinessRuleException('Erreur lors de l\'enregistrement', error);
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: UserResponse; token: string }> {
    try {
      // Find user
      const user = await this.executeQueryNullable<User>(
        async () =>
          await this.client
            .from('users')
            .select('*')
            .eq('email', email)
            .single()
      );

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Verify password
      if (!user.password_hash) {
        throw new UnauthorizedException('Mot de passe non défini');
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw new UnauthorizedException('Mot de passe incorrect');
      }

      // Generate token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Remove sensitive data
      const { password_hash, ...userResponse } = user;

      return {
        user: userResponse as UserResponse,
        token,
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      logger.error('Login error', { error: error.message, email });
      throw new BusinessRuleException('Erreur lors de la connexion', error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    try {
      const user = await this.executeQueryNullable<User>(
        async () =>
          await this.client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
      );

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      const { password_hash, ...userResponse } = user;
      return userResponse as UserResponse;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Get user error', { error: error.message, userId });
      throw new BusinessRuleException('Erreur lors de la récupération de l\'utilisateur', error);
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: JWTPayload): string {
    try {
      return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
      });
    } catch (error: any) {
      logger.error('Token generation error', { error: error.message });
      throw new InfrastructureException('Erreur lors de la génération du token', error);
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expiré');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token invalide');
      }
      logger.error('Token verification error', { error: error.message });
      throw new UnauthorizedException('Erreur lors de la vérification du token');
    }
  }
}

export const authService = new AuthService();

