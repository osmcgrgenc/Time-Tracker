'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown, TrendingUp, Clock, Target } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  xp: number;
  totalHours: number;
  completedTasks: number;
  streak: number;
  rank: number;
}

interface LeaderboardProps {
  currentUser: {
    id: string;
    name: string;
    level: number;
    xp: number;
    totalHours: number;
    completedTasks: number;
    streak: number;
  };
}

export function Leaderboard({ currentUser }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState('xp');

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockData: Omit<LeaderboardEntry, 'rank'>[] = [
      {
        id: currentUser.id,
        name: currentUser.name,
        level: currentUser.level,
        xp: currentUser.xp,
        totalHours: currentUser.totalHours,
        completedTasks: currentUser.completedTasks,
        streak: currentUser.streak
      },
      {
        id: '2',
        name: 'Alex Johnson',
        level: 15,
        xp: 2450,
        totalHours: 156,
        completedTasks: 89,
        streak: 12
      },
      {
        id: '3',
        name: 'Sarah Chen',
        level: 12,
        xp: 1890,
        totalHours: 134,
        completedTasks: 67,
        streak: 8
      },
      {
        id: '4',
        name: 'Mike Wilson',
        level: 18,
        xp: 3200,
        totalHours: 203,
        completedTasks: 112,
        streak: 15
      },
      {
        id: '5',
        name: 'Emma Davis',
        level: 10,
        xp: 1650,
        totalHours: 98,
        completedTasks: 54,
        streak: 6
      },
      {
        id: '6',
        name: 'David Kim',
        level: 14,
        xp: 2100,
        totalHours: 145,
        completedTasks: 78,
        streak: 10
      }
    ];

    // Sort and add ranks based on active tab
    const sortedData = [...mockData].sort((a, b) => {
      switch (activeTab) {
        case 'xp':
          return b.xp - a.xp;
        case 'hours':
          return b.totalHours - a.totalHours;
        case 'tasks':
          return b.completedTasks - a.completedTasks;
        case 'streak':
          return b.streak - a.streak;
        default:
          return b.xp - a.xp;
      }
    });

    const rankedData = sortedData.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    setLeaderboardData(rankedData);
  }, [currentUser, activeTab]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        2: 'bg-gray-100 text-gray-800 border-gray-300',
        3: 'bg-amber-100 text-amber-800 border-amber-300'
      };
      return colors[rank as keyof typeof colors];
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getStatValue = (entry: LeaderboardEntry, type: string) => {
    switch (type) {
      case 'xp':
        return `${entry.xp.toLocaleString()} XP`;
      case 'hours':
        return `${entry.totalHours}h`;
      case 'tasks':
        return `${entry.completedTasks} tasks`;
      case 'streak':
        return `${entry.streak} days`;
      default:
        return '';
    }
  };

  const currentUserEntry = leaderboardData.find(entry => entry.id === currentUser.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="xp" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              XP
            </TabsTrigger>
            <TabsTrigger value="hours" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="streak" className="text-xs">
              <Trophy className="h-3 w-3 mr-1" />
              Streak
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Current User Highlight */}
            {currentUserEntry && currentUserEntry.rank > 3 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-200 rounded-full">
                      <span className="text-sm font-bold text-blue-800">#{currentUserEntry.rank}</span>
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">You</div>
                      <div className="text-sm text-blue-700">Level {currentUserEntry.level}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-900">
                      {getStatValue(currentUserEntry, activeTab)}
                    </div>
                    <div className="text-xs text-blue-600">Your rank</div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Rankings */}
            <div className="space-y-2">
              {leaderboardData.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 border rounded-lg transition-all ${
                    entry.id === currentUser.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${entry.rank <= 3 ? 'shadow-sm' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {entry.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {entry.name}
                          {entry.id === currentUser.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">Level {entry.level}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">
                        {getStatValue(entry, activeTab)}
                      </div>
                      {entry.rank <= 3 && (
                        <Badge className={getRankBadge(entry.rank)} variant="outline">
                          Top {entry.rank}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Competition Info */}
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-2">
                Weekly competition resets every Monday
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>🥇 +200 XP</span>
                <span>🥈 +150 XP</span>
                <span>🥉 +100 XP</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}