'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Square, Brain, Coffee, Zap, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

interface FocusModeProps {
  onFocusComplete: (minutes: number) => void;
  onXPGain: (xp: number) => void;
}

type FocusType = 'pomodoro' | 'deep' | 'break' | 'custom';

interface FocusSession {
  type: FocusType;
  duration: number;
  remaining: number;
  isActive: boolean;
  isPaused: boolean;
  completedSessions: number;
}

export function FocusMode({ onFocusComplete, onXPGain }: FocusModeProps) {
  const [session, setSession] = useState<FocusSession>({
    type: 'pomodoro',
    duration: 25 * 60, // 25 minutes in seconds
    remaining: 25 * 60,
    isActive: false,
    isPaused: false,
    completedSessions: 0
  });
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customDuration, setCustomDuration] = useState('25');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const focusTypes = {
    pomodoro: { name: 'Pomodoro', duration: 25, icon: <Brain className="h-4 w-4" />, xp: 25 },
    deep: { name: 'Deep Focus', duration: 50, icon: <Zap className="h-4 w-4" />, xp: 50 },
    break: { name: 'Short Break', duration: 5, icon: <Coffee className="h-4 w-4" />, xp: 5 },
    custom: { name: 'Custom', duration: parseInt(customDuration), icon: <Brain className="h-4 w-4" />, xp: Math.floor(parseInt(customDuration) / 5) }
  };

  useEffect(() => {
    // Create audio element for notifications
    audioRef.current = new Audio('/notification.mp3'); // You'd need to add this sound file
    audioRef.current.volume = 0.5;
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session.isActive && !session.isPaused) {
      intervalRef.current = setInterval(() => {
        setSession(prev => {
          if (prev.remaining <= 1) {
            // Session completed
            handleSessionComplete();
            return {
              ...prev,
              remaining: 0,
              isActive: false,
              completedSessions: prev.completedSessions + 1
            };
          }
          return {
            ...prev,
            remaining: prev.remaining - 1
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.isActive, session.isPaused]);

  const handleSessionComplete = () => {
    const focusType = focusTypes[session.type];
    const minutes = Math.floor(session.duration / 60);
    
    // Play notification sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Fallback if audio fails
        console.log('Audio notification failed');
      });
    }
    
    // Show notification
    toast.success(`🎯 Focus session complete! +${focusType.xp} XP`);
    
    // Trigger callbacks
    onFocusComplete(minutes);
    onXPGain(focusType.xp);
    
    // Browser notification (if permission granted)
    if (Notification.permission === 'granted') {
      new Notification('Focus Session Complete!', {
        body: `Great job! You completed a ${minutes}-minute focus session.`,
        icon: '/favicon.ico'
      });
    }
  };

  const startSession = () => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    setSession(prev => ({
      ...prev,
      isActive: true,
      isPaused: false
    }));
  };

  const pauseSession = () => {
    setSession(prev => ({
      ...prev,
      isPaused: true
    }));
  };

  const resumeSession = () => {
    setSession(prev => ({
      ...prev,
      isPaused: false
    }));
  };

  const stopSession = () => {
    setSession(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      remaining: prev.duration
    }));
  };

  const changeFocusType = (type: FocusType) => {
    if (session.isActive) return; // Don't allow changes during active session
    
    const duration = type === 'custom' 
      ? parseInt(customDuration) * 60 
      : focusTypes[type].duration * 60;
    
    setSession(prev => ({
      ...prev,
      type,
      duration,
      remaining: duration
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((session.duration - session.remaining) / session.duration) * 100;
  };

  const getSessionColor = () => {
    switch (session.type) {
      case 'pomodoro': return 'text-red-600';
      case 'deep': return 'text-purple-600';
      case 'break': return 'text-green-600';
      case 'custom': return 'text-blue-600';
    }
  };

  const getProgressColor = () => {
    switch (session.type) {
      case 'pomodoro': return 'bg-red-500';
      case 'deep': return 'bg-purple-500';
      case 'break': return 'bg-green-500';
      case 'custom': return 'bg-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Focus Mode
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Focus Type Selection */}
        {!session.isActive && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(focusTypes).map(([key, type]) => (
                <Button
                  key={key}
                  variant={session.type === key ? "default" : "outline"}
                  onClick={() => changeFocusType(key as FocusType)}
                  className="flex items-center gap-2 h-12"
                  disabled={key === 'custom' && isNaN(parseInt(customDuration))}
                >
                  {type.icon}
                  <div className="text-left">
                    <div className="text-sm font-medium">{type.name}</div>
                    <div className="text-xs opacity-70">
                      {key === 'custom' ? `${customDuration}min` : `${type.duration}min`}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            {session.type === 'custom' && (
              <div className="flex items-center gap-2">
                <Select value={customDuration} onValueChange={setCustomDuration}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 20, 25, 30, 45, 60, 90, 120].map(duration => (
                      <SelectItem key={duration} value={duration.toString()}>
                        {duration} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Timer Display */}
        <div className="text-center space-y-4">
          <div className={`text-6xl font-mono font-bold ${getSessionColor()}`}>
            {formatTime(session.remaining)}
          </div>
          
          <Progress 
            value={getProgressPercentage()} 
            className="h-3"
          />
          
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {focusTypes[session.type].icon}
              {focusTypes[session.type].name}
            </Badge>
            <Badge variant="secondary">
              +{focusTypes[session.type].xp} XP
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!session.isActive ? (
            <Button onClick={startSession} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Focus
            </Button>
          ) : (
            <>
              {session.isPaused ? (
                <Button onClick={resumeSession} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              ) : (
                <Button onClick={pauseSession} variant="outline" className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button onClick={stopSession} variant="outline" className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Session Stats */}
        {session.completedSessions > 0 && (
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-sm font-medium text-green-800">
              Sessions Completed Today
            </div>
            <div className="text-2xl font-bold text-green-600">
              {session.completedSessions}
            </div>
            <div className="text-xs text-green-600">
              Total XP earned: {session.completedSessions * focusTypes[session.type].xp}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>💡 Tip: Turn off notifications for better focus</p>
          <p>🔔 Browser notifications will alert you when sessions complete</p>
        </div>
      </CardContent>
    </Card>
  );
}