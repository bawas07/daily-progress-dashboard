import { UserRepository } from '../repositories/user.repository';
import { UserPreferencesRepository } from '../repositories/user.preferences.repository';
import { PasswordService } from './password.service';
import { JwtService } from '../../../shared/jwt/jwt.service';
import { logger } from '../../../shared/logger/logger.service';
import { Container, resolveService } from '../../../shared/container';

/**
 * Custom error class for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for duplicate email registration
 */
export class DuplicateEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date | null;
  };
  preferences: {
    defaultActiveDays: string[];
    theme: string;
    timezone: string;
    enableNotifications: boolean;
  };
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date;
  };
  token: string;
}

export class AuthService {
  private userRepository: UserRepository;
  private preferencesRepository: UserPreferencesRepository;
  private passwordService: PasswordService;
  private jwtService: JwtService;

  /**
   * Constructor accepting dependencies directly (for testing) or via Container (for production)
   *
   * @param containerOrUserRepo - Either a Container instance (production) or UserRepository (testing)
   * @param preferencesRepository - UserPreferencesRepository (optional, only when passing mocks directly)
   * @param passwordService - PasswordService (optional, only when passing mocks directly)
   * @param jwtService - JwtService (optional, only when passing mocks directly)
   */
  constructor(
    containerOrUserRepo: Container | UserRepository,
    preferencesRepository?: UserPreferencesRepository,
    passwordService?: PasswordService,
    jwtService?: JwtService
  ) {
    // Check if first argument is a Container or direct dependencies
    if (containerOrUserRepo instanceof Container) {
      // Production: use container to resolve dependencies
      this.userRepository = resolveService<UserRepository>('UserRepository', containerOrUserRepo);
      this.preferencesRepository = resolveService<UserPreferencesRepository>('UserPreferencesRepository', containerOrUserRepo);
      this.passwordService = resolveService<PasswordService>('PasswordService', containerOrUserRepo);
      this.jwtService = resolveService<JwtService>('JwtService', containerOrUserRepo);
    } else {
      // Testing: use provided dependencies directly
      this.userRepository = containerOrUserRepo;
      this.preferencesRepository = preferencesRepository!;
      this.passwordService = passwordService!;
      this.jwtService = jwtService!;
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    logger.info('Registering new user', { email: data.email });

    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase().trim();

    // Validate password strength
    const validation = this.passwordService.validateStrength(data.password);
    if (!validation.valid) {
      throw new ValidationError(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new DuplicateEmailError('Email already registered');
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(data.password);

    // Create user
    const user = await this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      name: data.name,
    });

    // Create default preferences
    const preferences = await this.preferencesRepository.create(user.id);

    logger.info('User registered successfully', { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      },
      preferences: {
        defaultActiveDays: preferences.defaultActiveDays as string[],
        theme: preferences.theme,
        timezone: preferences.timezone,
        enableNotifications: preferences.enableNotifications,
      },
    };
  }

  /**
   * Login an existing user
   */
  async login(data: LoginData): Promise<LoginResult> {
    logger.info('User login attempt', { email: data.email });

    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase().trim();

    // Find user by email
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValid = await this.passwordService.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    const updatedUser = await this.userRepository.updateLastLogin(user.id);

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    logger.info('User logged in successfully', { userId: user.id });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        lastLogin: updatedUser.lastLogin!,
      },
      token,
    };
  }
}
