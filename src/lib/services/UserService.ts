import { BaseService } from './base/BaseService';
import { UserRepository, UserFilters, UserProfile } from '../repositories/UserRepository';
import { User } from '@prisma/client';
import { ServiceResult, PaginationOptions } from './base/IService';

export interface CreateUserData {
  email: string;
  name: string;
  clerkId: string;
  hashedPassword?: string;
  preferences?: Record<string, any>;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  preferences?: Record<string, any>;
  isActive?: boolean;
}

export interface UserStats {
  totalTime: number;
  totalXP: number;
  projectCount: number;
  taskCount: number;
  timerCount: number;
  completedTasks: number;
  activeProjects: number;
  averageSessionTime: number;
}

export class UserService extends BaseService {
  readonly serviceName = 'UserService';
  private userRepository: UserRepository;

  constructor() {
    super();
    this.userRepository = new UserRepository();
  }

  async getUsers(
    filters: UserFilters = {},
    pagination?: PaginationOptions
  ): Promise<ServiceResult<UserProfile[]>> {
    try {
      const users = await this.userRepository.getUsersWithFilters(filters, pagination);
      
      return this.createSuccessResult(users);
    } catch (error) {
      this.logOperation('Failed to get users', undefined, { error, filters });
      return this.createErrorResult('Failed to retrieve users');
    }
  }

  async getUserById(userId: string): Promise<ServiceResult<User | null>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return this.createErrorResult('User not found');
      }

      return this.createSuccessResult(user);
    } catch (error) {
      this.logOperation('Failed to get user by ID', userId, { error });
      return this.createErrorResult('Failed to retrieve user');
    }
  }

  async getUserProfile(userId: string): Promise<ServiceResult<UserProfile | null>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      const userProfile = await this.userRepository.getUserProfile(userId);
      
      if (!userProfile) {
        return this.createErrorResult('User not found');
      }

      return this.createSuccessResult(userProfile);
    } catch (error) {
      this.logOperation('Failed to get user profile', userId, { error });
      return this.createErrorResult('Failed to retrieve user profile');
    }
  }

  async getUserByEmail(email: string): Promise<ServiceResult<User | null>> {
    try {
      if (!email || !this.isValidEmail(email)) {
        return this.createErrorResult('Invalid email format');
      }

      const user = await this.userRepository.findByEmail(email);
      
      return this.createSuccessResult(user);
    } catch (error) {
      this.logOperation('Failed to get user by email', undefined, { error, email });
      return this.createErrorResult('Failed to retrieve user');
    }
  }

  async getUserByClerkId(clerkId: string): Promise<ServiceResult<User | null>> {
    try {
      if (!clerkId) {
        return this.createErrorResult('Clerk ID is required');
      }

      const user = await this.userRepository.findByClerkId(clerkId);
      
      return this.createSuccessResult(user);
    } catch (error) {
      this.logOperation('Failed to get user by Clerk ID', undefined, { error, clerkId });
      return this.createErrorResult('Failed to retrieve user');
    }
  }

  async createUser(data: CreateUserData): Promise<ServiceResult<User>> {
    try {
      // Validate required fields
      if (!data.email || !data.name || !data.clerkId) {
        return this.createErrorResult('Email, name, and Clerk ID are required');
      }

      if (!this.isValidEmail(data.email)) {
        return this.createErrorResult('Invalid email format');
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        return this.createErrorResult('User with this email already exists');
      }

      const existingClerkUser = await this.userRepository.findByClerkId(data.clerkId);
      if (existingClerkUser) {
        return this.createErrorResult('User with this Clerk ID already exists');
      }

      const user = await this.userRepository.create({
        email: data.email,
        name: data.name,
        clerkId: data.clerkId,
        hashedPassword: data.hashedPassword,
        preferences: data.preferences || {},
        totalXP: 0,
        level: 1,
        isActive: true,
        lastActiveAt: new Date()
      });

      this.logOperation('User created successfully', user.id, { email: user.email });
      return this.createSuccessResult(user);
    } catch (error) {
      this.logOperation('Failed to create user', undefined, { error, data: this.sanitizeForLog(data) });
      return this.createErrorResult('Failed to create user');
    }
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<ServiceResult<User>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      // Validate email if provided
      if (data.email && !this.isValidEmail(data.email)) {
        return this.createErrorResult('Invalid email format');
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        return this.createErrorResult('User not found');
      }

      // Check email uniqueness if email is being updated
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(data.email);
        if (emailExists) {
          return this.createErrorResult('Email already in use');
        }
      }

      const updatedUser = await this.userRepository.update(userId, data);
      
      if (!updatedUser) {
        return this.createErrorResult('Failed to update user');
      }

      this.logOperation('User updated successfully', userId, { changes: Object.keys(data) });
      return this.createSuccessResult(updatedUser);
    } catch (error) {
      this.logOperation('Failed to update user', userId, { error, data: this.sanitizeForLog(data) });
      return this.createErrorResult('Failed to update user');
    }
  }

  async deleteUser(userId: string): Promise<ServiceResult<boolean>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        return this.createErrorResult('User not found');
      }

      const deleted = await this.userRepository.delete(userId);
      
      if (!deleted) {
        return this.createErrorResult('Failed to delete user');
      }

      this.logOperation('User deleted successfully', userId);
      return this.createSuccessResult(true);
    } catch (error) {
      this.logOperation('Failed to delete user', userId, { error });
      return this.createErrorResult('Failed to delete user');
    }
  }

  async getUserStats(userId: string): Promise<ServiceResult<UserStats>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      const stats = await this.userRepository.getUserStats(userId);
      
      if (!stats) {
        return this.createErrorResult('User not found');
      }

      return this.createSuccessResult(stats);
    } catch (error) {
      this.logOperation('Failed to get user stats', userId, { error });
      return this.createErrorResult('Failed to retrieve user statistics');
    }
  }

  async updateUserXP(userId: string, xpAmount: number): Promise<ServiceResult<User>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      if (typeof xpAmount !== 'number' || xpAmount < 0) {
        return this.createErrorResult('XP amount must be a positive number');
      }

      const updatedUser = await this.userRepository.updateXP(userId, xpAmount);
      
      if (!updatedUser) {
        return this.createErrorResult('User not found');
      }

      // Check if user should level up
      const newLevel = this.calculateLevel(updatedUser.totalXP || 0);
      if (newLevel > updatedUser.level) {
        await this.userRepository.updateLevel(userId, newLevel);
        updatedUser.level = newLevel;
        this.logOperation('User leveled up', userId, { newLevel, totalXP: updatedUser.totalXP });
      }

      this.logOperation('User XP updated', userId, { xpAmount, totalXP: updatedUser.totalXP });
      return this.createSuccessResult(updatedUser);
    } catch (error) {
      this.logOperation('Failed to update user XP', userId, { error, xpAmount });
      return this.createErrorResult('Failed to update user XP');
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<ServiceResult<User>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      const updatedUser = await this.userRepository.updatePreferences(userId, preferences);
      
      if (!updatedUser) {
        return this.createErrorResult('User not found');
      }

      this.logOperation('User preferences updated', userId);
      return this.createSuccessResult(updatedUser);
    } catch (error) {
      this.logOperation('Failed to update user preferences', userId, { error });
      return this.createErrorResult('Failed to update user preferences');
    }
  }

  async updateLastActiveAt(userId: string): Promise<ServiceResult<User>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      const updatedUser = await this.userRepository.updateLastActiveAt(userId);
      
      if (!updatedUser) {
        return this.createErrorResult('User not found');
      }

      return this.createSuccessResult(updatedUser);
    } catch (error) {
      this.logOperation('Failed to update last active time', userId, { error });
      return this.createErrorResult('Failed to update last active time');
    }
  }

  async deactivateUser(userId: string): Promise<ServiceResult<User>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      const updatedUser = await this.userRepository.deactivateUser(userId);
      
      if (!updatedUser) {
        return this.createErrorResult('User not found');
      }

      this.logOperation('User deactivated', userId);
      return this.createSuccessResult(updatedUser);
    } catch (error) {
      this.logOperation('Failed to deactivate user', userId, { error });
      return this.createErrorResult('Failed to deactivate user');
    }
  }

  async activateUser(userId: string): Promise<ServiceResult<User>> {
    try {
      if (!this.isValidId(userId)) {
        return this.createErrorResult('Invalid user ID format');
      }

      const updatedUser = await this.userRepository.activateUser(userId);
      
      if (!updatedUser) {
        return this.createErrorResult('User not found');
      }

      this.logOperation('User activated', userId);
      return this.createSuccessResult(updatedUser);
    } catch (error) {
      this.logOperation('Failed to activate user', userId, { error });
      return this.createErrorResult('Failed to activate user');
    }
  }

  async searchUsers(
    query: string,
    pagination?: PaginationOptions
  ): Promise<ServiceResult<UserProfile[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return this.createErrorResult('Search query must be at least 2 characters long');
      }

      const users = await this.userRepository.searchUsers(query.trim(), pagination);
      
      return this.createSuccessResult(users);
    } catch (error) {
      this.logOperation('Failed to search users', undefined, { error, query });
      return this.createErrorResult('Failed to search users');
    }
  }

  private calculateLevel(totalXP: number): number {
    // Simple level calculation: every 1000 XP = 1 level
    // You can customize this formula based on your requirements
    return Math.floor(totalXP / 1000) + 1;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidId(id: string): boolean {
    return typeof id === 'string' && id.length > 0;
  }

  private sanitizeForLog(data: any): any {
    const { hashedPassword, ...sanitized } = data;
    return sanitized;
  }
}