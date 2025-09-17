'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Target, Clock, Award, Medal, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  current: number;
  xpReward: number;
  unlocked: boolean;
  category: 'time' | 'tasks' | 'streak' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementSystemProps {
  userStats: {
    totalHours: number;
    completedTasks: number;
    streak: number;
    level: number;
  };
  onXPGain: (xp: number) => void;
}

export function AchievementSystem({ userStats, onXPGain }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [newUnlocked, setNewUnlocked] = useState<Achievement[]>([]);

  const achievementTemplates: Omit<Achievement, 'current' | 'unlocked'>[] = [
    {
      id: 'first_hour',
      title: 'Getting Started',
      description: 'Track your first hour',
      icon: <Clock className="h-5 w-5" />,
      requirement: 1,
      xpReward: 50,
      category: 'time',
      rarity: 'common'
    },
    {
      id: 'ten_hours',
      title: 'Time Keeper',
      description: 'Track 10 hours total',
      icon: <Target className="h-5 w-5" />,
      requirement: 10,
      xpReward: 100,
      category: 'time',
      rarity: 'common'
    },
    {
      id: 'hundred_hours',
      title: 'Time Master',
      description: 'Track 100 hours total',
      icon: <Award className="h-5 w-5" />,
      requirement: 100,
      xpReward: 500,
      category: 'time',
      rarity: 'rare'
    },
    {
      id: 'first_task',
      title: 'Task Rookie',
      description: 'Complete your first task',
      icon: <Star className="h-5 w-5" />,
      requirement: 1,
      xpReward: 25,
      category: 'tasks',
      rarity: 'common'
    },
    {
      id: 'ten_tasks',
      title: 'Task Warrior',
      description: 'Complete 10 tasks',
      icon: <Medal className="h-5 w-5" />,
      requirement: 10,
      xpReward: 150,
      category: 'tasks',
      rarity: 'common'
    },
    {
      id: 'week_streak',
      title: 'Consistent',
      description: 'Maintain a 7-day streak',
      icon: <Zap className="h-5 w-5" />,
      requirement: 7,
      xpReward: 200,
      category: 'streak',
      rarity: 'rare'
    }
  ];

  useEffect(() => {
    const updatedAchievements = achievementTemplates.map(template => {
      let current = 0;
      
      switch (template.category) {
        case 'time':
          current = userStats.totalHours;
          break;
        case 'tasks':
          current = userStats.completedTasks;
          break;
        case 'streak':
          current = userStats.streak;
          break;
        case 'special':
          current = userStats.level;
          break;
      }
      
      const wasUnlocked = achievements.find(a => a.id === template.id)?.unlocked || false;
      const isUnlocked = current >= template.requirement;
      
      if (!wasUnlocked && isUnlocked) {
        const newAchievement = { ...template, current, unlocked: isUnlocked };
        setNewUnlocked(prev => [...prev, newAchievement]);
        onXPGain(template.xpReward);
        toast.success(`🏆 Achievement: ${template.title}! +${template.xpReward} XP`);
      }
      
      return {
        ...template,
        current,
        unlocked: isUnlocked
      };
    });
    
    setAchievements(updatedAchievements);
  }, [userStats]);

  useEffect(() => {
    if (newUnlocked.length > 0) {
      setShowDialog(true);
    }
  }, [newUnlocked]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg ${
                  achievement.unlocked 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded ${achievement.unlocked ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  <Badge className={getRarityColor(achievement.rarity)}>
                    {achievement.rarity}
                  </Badge>
                </div>
                
                {!achievement.unlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{achievement.current}/{achievement.requirement}</span>
                      <span>+{achievement.xpReward} XP</span>
                    </div>
                    <Progress 
                      value={(achievement.current / achievement.requirement) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
                
                {achievement.unlocked && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 font-medium">✓ Unlocked</span>
                    <span className="text-green-600">+{achievement.xpReward} XP</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">🎉 Achievement Unlocked!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {newUnlocked.map(achievement => (
              <div key={achievement.id} className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-yellow-200 rounded-full text-yellow-700">
                    {achievement.icon}
                  </div>
                </div>
                <h3 className="font-bold text-lg">{achievement.title}</h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                <p className="text-sm font-medium text-green-600 mt-2">+{achievement.xpReward} XP</p>
              </div>
            ))}
            <Button 
              onClick={() => {
                setShowDialog(false);
                setNewUnlocked([]);
              }}
              className="w-full"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}