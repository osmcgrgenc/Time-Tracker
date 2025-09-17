'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { XPHistory as XPHistoryType } from '@/types';
import { Trophy, Clock, Target, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

export default function XPHistory() {
  const { user } = useAuth();
  const [xpHistory, setXpHistory] = useState<XPHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      fetchXPHistory();
    }
  }, [user]);

  const fetchXPHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/xp-history?userId=${user.id}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setXpHistory(data.xpHistory);
      }
    } catch (error) {
      console.error('Error fetching XP history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'TIMER_STARTED':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'TIMER_COMPLETED':
        return <Trophy className="h-4 w-4 text-green-500" />;
      case 'TIMER_CANCELLED':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'STREAK_BONUS':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'LEVEL_UP':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'TIMER_STARTED':
        return 'bg-blue-100 text-blue-800';
      case 'TIMER_COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'TIMER_CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'STREAK_BONUS':
        return 'bg-purple-100 text-purple-800';
      case 'LEVEL_UP':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAction = (action: string) => {
    switch (action) {
      case 'TIMER_STARTED':
        return 'Timer Başlatıldı';
      case 'TIMER_COMPLETED':
        return 'Timer Tamamlandı';
      case 'TIMER_CANCELLED':
        return 'Timer İptal Edildi';
      case 'STREAK_BONUS':
        return 'Seri Bonusu';
      case 'LEVEL_UP':
        return 'Seviye Atlandı';
      case 'DAILY_GOAL':
        return 'Günlük Hedef';
      default:
        return action;
    }
  };

  if (!user) return null;

  const displayedHistory = isExpanded ? xpHistory : xpHistory.slice(0, 5);

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              XP Geçmişi
            </CardTitle>
            <CardDescription>Kazandığınız puanların tarihçesi</CardDescription>
          </div>
          {xpHistory.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Daha Az Göster
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Daha Fazla Göster
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <div className="w-32 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        ) : xpHistory.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz XP kazanmadınız</h3>
            <p className="text-gray-500">Timer'larınızı kullanarak XP kazanmaya başlayın!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {getActionIcon(entry.action)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatAction(entry.action)}</span>
                      <Badge variant="secondary" className={getActionColor(entry.action)}>
                        {entry.xpEarned > 0 ? '+' : ''}{entry.xpEarned} XP
                      </Badge>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-gray-600">{entry.description}</p>
                    )}
                    {entry.timer && (
                      <p className="text-xs text-gray-500">
                        {entry.timer.note || entry.timer.project?.name || 'Timer'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
