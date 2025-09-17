'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target, Clock, Zap, Star, Trophy, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
  type: 'time' | 'tasks' | 'streak' | 'focus';
}

interface DailyChallengesProps {
  userStats: {
    todayHours: number;
    todayTasks: number;
    currentStreak: number;
    focusTime: number;
  };
  onXPGain: (xp: number) => void;
}

export function DailyChallenges({ userStats, onXPGain }: DailyChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedToday, setCompletedToday] = useState(0);

  const generateDailyChallenges = (): Challenge[] => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('challengeDate');
    
    // Generate new challenges if it's a new day
    if (savedDate !== today) {
      const newChallenges: Challenge[] = [
        {
          id: 'daily_time',
          title: 'Time Goal',
          description: 'Track 2 hours today',
          icon: <Clock className="h-4 w-4" />,
          target: 2,
          current: 0,
          xpReward: 100,
          completed: false,
          type: 'time'
        },
        {
          id: 'daily_tasks',
          title: 'Task Master',
          description: 'Complete 3 tasks today',
          icon: <Target className="h-4 w-4" />,
          target: 3,
          current: 0,
          xpReward: 75,
          completed: false,
          type: 'tasks'
        },
        {
          id: 'focus_session',
          title: 'Deep Focus',
          description: 'Have a 25-minute focused session',
          icon: <Zap className="h-4 w-4" />,
          target: 25,
          current: 0,
          xpReward: 50,
          completed: false,
          type: 'focus'
        }
      ];
      
      localStorage.setItem('challengeDate', today);
      localStorage.setItem('dailyChallenges', JSON.stringify(newChallenges));
      return newChallenges;
    }
    
    // Load existing challenges
    const saved = localStorage.getItem('dailyChallenges');
    return saved ? JSON.parse(saved) : [];
  };

  useEffect(() => {
    const initialChallenges = generateDailyChallenges();
    setChallenges(initialChallenges);
  }, []);

  useEffect(() => {
    const updatedChallenges = challenges.map(challenge => {
      let current = 0;
      
      switch (challenge.type) {
        case 'time':
          current = userStats.todayHours;
          break;
        case 'tasks':
          current = userStats.todayTasks;
          break;
        case 'focus':
          current = userStats.focusTime;
          break;
        case 'streak':
          current = userStats.currentStreak;
          break;
      }
      
      const wasCompleted = challenge.completed;
      const isCompleted = current >= challenge.target;
      
      // Check for new completions
      if (!wasCompleted && isCompleted) {
        onXPGain(challenge.xpReward);
        toast.success(`🎯 Challenge Complete: ${challenge.title}! +${challenge.xpReward} XP`);
        setCompletedToday(prev => prev + 1);
      }
      
      return {
        ...challenge,
        current: Math.min(current, challenge.target),
        completed: isCompleted
      };
    });
    
    setChallenges(updatedChallenges);
    localStorage.setItem('dailyChallenges', JSON.stringify(updatedChallenges));
  }, [userStats]);

  const totalXP = challenges.reduce((sum, challenge) => sum + (challenge.completed ? challenge.xpReward : 0), 0);
  const completionRate = challenges.length > 0 ? (challenges.filter(c => c.completed).length / challenges.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Daily Challenges
          </CardTitle>
          <Badge variant={completionRate === 100 ? "default" : "secondary"}>
            {challenges.filter(c => c.completed).length}/{challenges.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Daily Progress</span>
            <span className="text-sm text-gray-600">{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2 mb-2" />
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Total XP Earned: {totalXP}</span>
            {completionRate === 100 && (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Perfect Day!
              </span>
            )}
          </div>
        </div>

        {/* Individual Challenges */}
        <div className="space-y-3">
          {challenges.map(challenge => (
            <div
              key={challenge.id}
              className={`p-4 border rounded-lg transition-all ${
                challenge.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    challenge.completed 
                      ? 'bg-green-200 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {challenge.completed ? <CheckCircle className="h-4 w-4" /> : challenge.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{challenge.title}</h4>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    +{challenge.xpReward} XP
                  </div>
                  {challenge.completed && (
                    <div className="text-xs text-green-600">✓ Complete</div>
                  )}
                </div>
              </div>
              
              {!challenge.completed && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{challenge.current}/{challenge.target}</span>
                  </div>
                  <Progress 
                    value={(challenge.current / challenge.target) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bonus Rewards */}
        {completionRate === 100 && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Perfect Day Bonus!</span>
            </div>
            <p className="text-sm text-yellow-700 mb-2">
              You completed all daily challenges! Here's your bonus reward:
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bonus XP</span>
              <Badge className="bg-yellow-200 text-yellow-800">+50 XP</Badge>
            </div>
          </div>
        )}

        {/* Reset Info */}
        <div className="text-center text-xs text-gray-500 pt-2 border-t">
          Challenges reset daily at midnight
        </div>
      </CardContent>
    </Card>
  );
}