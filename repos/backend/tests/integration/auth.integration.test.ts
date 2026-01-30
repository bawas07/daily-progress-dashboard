
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApp } from '../../src/app';
import { container } from '../../src/shared/container';
import { createMockPrismaClient } from '../setup/mocks/database.mock';
import { JwtService } from '../../src/shared/jwt/jwt.service';
import { PasswordService } from '../../src/modules/auth/services/password.service';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { UserPreferencesService } from '../../src/modules/user-preferences/services/user.preferences.service';
import { UserRepository } from '../../src/modules/auth/repositories/user.repository';
import { UserPreferencesRepository } from '../../src/modules/auth/repositories/user.preferences.repository';

// Mock DatabaseService
class MockDatabaseService {
    public client: any;

    constructor() {
        this.client = createMockPrismaClient();
    }

    async connect() { return Promise.resolve(); }
    async disconnect() { return Promise.resolve(); }
}

describe('Authentication Integration Tests', () => {
    let app: any;
    let mockPrisma: ReturnType<typeof createMockPrismaClient>;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: '$2b$10$r.5...', // Mocked hash
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
    };

    const mockPreferences = {
        id: 'pref-123',
        userId: 'user-123',
        defaultActiveDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        theme: 'auto',
        timezone: 'UTC',
        enableNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        // 1. Clear container
        container.clear();

        // 2. Create mock database service instance
        const mockDbService = new MockDatabaseService();
        mockPrisma = mockDbService.client;

        // 3. Register services manually
        // We register a factory that returns our mock instance
        container.register('DatabaseService', class {
            constructor() { return mockDbService; }
        } as any);

        container.register('JwtService', JwtService);
        container.register('PasswordService', PasswordService);
        container.register('UserRepository', UserRepository);
        container.register('UserPreferencesRepository', UserPreferencesRepository);
        container.register('AuthService', AuthService);
        container.register('UserPreferencesService', UserPreferencesService);

        // 4. Create app
        app = createApp();
    });

    describe('POST /api/auth/register', () => {
        const validRegisterData = {
            email: 'test@example.com',
            password: 'Password123!',
            name: 'Test User',
        };

        it('should register a new user successfully', async () => {
            // Mock DB calls
            mockPrisma.user.findFirst.mockResolvedValue(null); // No existing user
            mockPrisma.user.create.mockResolvedValue(mockUser);
            mockPrisma.userPreferences.create.mockResolvedValue(mockPreferences);

            const res = await app.request('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validRegisterData),
            });

            expect(res.status).toBe(201);
            const body = await res.json();

            expect(body.data).toHaveProperty('user');
            expect(body.data.user.email).toBe(validRegisterData.email);
            expect(body.data).toHaveProperty('preferences');

            // Verify DB calls
            expect(mockPrisma.user.create).toHaveBeenCalled();
            expect(mockPrisma.userPreferences.create).toHaveBeenCalled();
        });

        it('should fail when email is already registered', async () => {
            // Mock existing user
            mockPrisma.user.findFirst.mockResolvedValue(mockUser);

            const res = await app.request('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validRegisterData),
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E002'); // DuplicateEmailError
            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });

        it('should fail when password is weak', async () => {
            const weakData = { ...validRegisterData, password: 'weak' };

            const res = await app.request('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(weakData),
            });

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.code).toBe('E001'); // ValidationError
            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });
    });

    describe('POST /api/auth/login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'Password123!',
        };

        it('should login successfully with valid credentials', async () => {
            // Logic inside PasswordService uses bcrypt.compare
            // Since we are using the REAL PasswordService, we need a real hash validation.
            // However, mocking bcrypt inside PasswordService is hard without mocking the service itself.
            // Alternatively, we can let PasswordService run, but we need to ensure the hash matches.
            // Or we can just mock PasswordService too if we want to isolate from bcrypt speed.
            // BUT this is an integration test, we should probably use real bcrypt.
            // So I need to generate a real hash for the mock user.

            // Actually, let's just use the real PasswordService but we need to prep the mockUser with a known hash.
            // Or, since we don't want to run expensive bcrypt in every test, maybe mocking PasswordService IS better?
            // "Integration test" is fuzzy. Usually we want to test "Application Logic".
            // Let's rely on real PasswordService but pre-calculate a hash for "Password123!".
            // For now, let's try to mock the password check by mocking the repository response properly.

            // Let's create a Helper to generate hash if needed, or just mock PasswordService.
            // Using real PasswordService is better for "Integration".
            // I will put a placeholder hash and HOPE bcrypt doesn't crash on invalid salt, 
            // but `bcrypt.compare` will fail.
            // I will overwrite `passwordService.compare` to return true for this test OR 
            // I will actually compute a hash.
            // Computing a hash is safer.
            const bcrypt = await import('bcrypt');
            const realHash = await bcrypt.hash('Password123!', 10);

            mockPrisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                passwordHash: realHash
            });
            // Login uses findFirst for email lookup
            mockPrisma.user.findFirst.mockResolvedValue({
                ...mockUser,
                passwordHash: realHash
            });
            mockPrisma.user.update.mockResolvedValue({
                ...mockUser,
                lastLogin: new Date()
            });

            const res = await app.request('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validLoginData),
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data).toHaveProperty('token');
            expect(body.data.user.email).toBe(validLoginData.email);
        });

        it('should fail with invalid password', async () => {
            const bcrypt = await import('bcrypt');
            const realHash = await bcrypt.hash('Password123!', 10);

            mockPrisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                passwordHash: realHash
            });

            const res = await app.request('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...validLoginData, password: 'WrongPassword' }),
            });

            expect(res.status).toBe(401); // AuthenticationError
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user profile when authenticated', async () => {
            // We need a valid token. Since we use real JwtService, we can sign one.
            const jwtService = new JwtService();
            const token = jwtService.sign({ sub: mockUser.id, email: mockUser.email });

            // Mock findUnique (expected)
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            // Mock findFirst (fallback)
            mockPrisma.user.findFirst.mockResolvedValue(mockUser);

            const res = await app.request('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.user.email).toBe(mockUser.email);
        });

        it('should fail without token', async () => {
            const res = await app.request('/api/auth/me', {
                method: 'GET',
            });
            expect(res.status).toBe(401);
        });
    });
});
