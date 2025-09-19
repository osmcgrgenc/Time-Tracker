import { XPAction, XPHistory } from '@prisma/client';
import { BaseService } from './base/BaseService';
import { ServiceResult } from './base/IService';
import { db } from '@/lib/db';

/**
 * XP reward configuration
 */
const XP_REWARDS: Record<XPAction, number> = {
  TIMER_STARTED: 5,
  TIMER_COMPLETED: 10,
  TIMER_CANCELLED: -5,
  STREAK_BONUS: 25,
  LEVEL_UP: 50,
  DAILY_GOAL: 100,
};

/**
 * XP service for managing user experience points
 */
export class XPService extends BaseService {
  readonly serviceName = 'XPService';

  /**
   * Award XP to user for an action
   */
  async awardXP(
    userId: string,
    action: XPAction,
    customAmount?: number
  ): Promise<ServiceResult<XPHistory>> {
    try {
      this.logOperation('awardXP', userId, { action, customAmount });

      // Validate user exists
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return this.createErrorResult('User not found');
      }

      const xpAmount = customAmount || XP_REWARDS[action] || 0;

      if (xpAmount <= 0) {
        return this.createErrorResult('XP amount must be positive');
      }

      // Create XP history record
      const xpHistory = await db.xPHistory.create({
        data: {
          userId,
          action,
          xpEarned: xpAmount,
        },
      });

      // Update user's total XP
      await db.user.update({
        where: { id: userId },
        data: {
          totalXP: {
            increment: xpAmount,
          },
        },
      });

      return this.createSuccessResult(xpHistory);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user's XP history
   */
  async getXPHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResult<XPHistory[]>> {
    try {
      this.logOperation('getXPHistory', userId, { limit, offset });

      const history = await db.xPHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return this.createSuccessResult(history);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user's total XP and level
   */
  async getUserXPStats(
    userId: string
  ): Promise<ServiceResult<{
    totalXP: number;
    level: number;
    xpToNextLevel: number;
    xpForCurrentLevel: number;
  }>> {
    try {
      this.logOperation('getUserXPStats', userId);

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { totalXP: true },
      });

      if (!user) {
        return this.createErrorResult('User not found');
      }

      const totalXP = user.totalXP || 0;
      const level = this.calculateLevel(totalXP);
      const xpForCurrentLevel = this.getXPForLevel(level);
      const xpForNextLevel = this.getXPForLevel(level + 1);
      const xpToNextLevel = xpForNextLevel - totalXP;

      return this.createSuccessResult({
        totalXP,
        level,
        xpToNextLevel,
        xpForCurrentLevel,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Calculate user level based on total XP
   */
  private calculateLevel(totalXP: number): number {
    // Level formula: level = floor(sqrt(totalXP / 100))
    // This means: Level 1 = 100 XP, Level 2 = 400 XP, Level 3 = 900 XP, etc.
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  /**
   * Get XP required for a specific level
   */
  private getXPForLevel(level: number): number {
    // XP required = (level - 1)^2 * 100
    return Math.pow(level - 1, 2) * 100;
  }
}