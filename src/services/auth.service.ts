import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { SupabaseService } from './supabase.service';
import { User, CreateUserInput, UserResponse, UpdateUserInput } from '../models/User.model';
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
      // Check if user already exists - without .single() to avoid PGRST116
      logger.info('Checking if user exists', { email: input.email });
      const existingUserResult = await this.client
        .from('users')
        .select('*')
        .eq('email', input.email);
      
      logger.info('Existing user check result', { 
        hasData: !!existingUserResult.data,
        dataLength: existingUserResult.data?.length || 0,
        error: existingUserResult.error?.message 
      });

      if (existingUserResult.error && existingUserResult.error.code !== 'PGRST116') {
        logger.error('Error checking existing user', { error: existingUserResult.error.message });
        throw new InfrastructureException(
          `Erreur lors de la vérification de l'utilisateur: ${existingUserResult.error.message}`,
          existingUserResult.error
        );
      }

      const existingUser = existingUserResult.data && existingUserResult.data.length > 0 
        ? existingUserResult.data[0] as User 
        : null;

      if (existingUser) {
        throw new ValidationException('Un utilisateur avec cet email existe déjà');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, this.saltRounds);

      // Create user - Insert without .single() first to get better error messages
      logger.info('Attempting to insert user', { email: input.email });
      const insertResult = await this.client
        .from('users')
        .insert({
          full_name: input.full_name,
          email: input.email,
          phone: input.phone,
          password_hash: passwordHash,
          role: input.role || 'client',
          is_verified: false,
          national_id_front_url: input.national_id_front_url,
          national_id_back_url: input.national_id_back_url,
        })
        .select();
      
      logger.info('Insert result', { 
        hasData: !!insertResult.data, 
        dataLength: insertResult.data?.length || 0,
        error: insertResult.error?.message,
        errorCode: insertResult.error?.code,
        errorDetails: insertResult.error?.details,
        errorHint: insertResult.error?.hint
      });

      if (insertResult.error) {
        logger.error('Insert failed', { 
          error: insertResult.error.message,
          code: insertResult.error.code,
          details: insertResult.error.details 
        });
        throw new InfrastructureException(
          `Erreur lors de l'insertion: ${insertResult.error.message}${insertResult.error.details ? ` (${insertResult.error.details})` : ''}`,
          insertResult.error
        );
      }

      if (!insertResult.data || insertResult.data.length === 0) {
        logger.error('Insert returned no data', { email: input.email });
        throw new InfrastructureException(
          'L\'insertion a réussi mais aucune donnée n\'a été retournée. Vérifiez que les triggers ou contraintes n\'empêchent pas le retour des données.'
        );
      }

      const user = insertResult.data[0] as User;

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
   * Update user profile (e.g. national ID URLs)
   */
  async updateUserProfile(userId: string, input: UpdateUserInput): Promise<UserResponse> {
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.full_name !== undefined) updateData.full_name = input.full_name;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.is_verified !== undefined) updateData.is_verified = input.is_verified;
      if (input.national_id_front_url !== undefined) updateData.national_id_front_url = input.national_id_front_url;
      if (input.national_id_back_url !== undefined) updateData.national_id_back_url = input.national_id_back_url;

      const { data, error } = await this.client
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new InfrastructureException(`Erreur lors de la mise à jour du profil: ${error.message}`, error);
      }
      if (!data) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      const { password_hash, ...userResponse } = data as User;
      return userResponse as UserResponse;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof InfrastructureException) {
        throw error;
      }
      logger.error('Update user profile error', { error: error.message, userId });
      throw new BusinessRuleException('Erreur lors de la mise à jour du profil', error);
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: JWTPayload): string {
    try {
      return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as string | number,
      } as SignOptions);
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

