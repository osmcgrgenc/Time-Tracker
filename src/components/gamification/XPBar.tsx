'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap } from 'lucide-react';

interface XPBarProps {
  level: number;
  currentXP: number;
  xpToNext: number;
  recentXPGain?: number;
  showAnimation?: boolean;
}

export function XPBar({ level, currentXP, xpToNext, recentXPGain, showAnimation }: XPBarProps) {
  const [animatedXP, setAnimatedXP] = useState(currentXP);
  const [showGainAnimation, setShowGainAnimation] = useState(false);

  const currentLevelXP = (level - 1) * 100;
  const progressXP = currentXP - currentLevelXP;
  const progressPercentage = (progressXP / 100) * 100;

  useEffect(() => {
    if (recentXPGain && recentXPGain > 0) {
      setShowGainAnimation(true);
      
      // Animate XP counter
      const startXP = currentXP - recentXPGain;
      const duration = 1000;
      const steps = 30;
      const increment = recentXPGain / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setAnimatedXP(Math.min(startXP + (increment * step), currentXP));
        
        if (step >= steps) {
          clearInterval(timer);
          setAnimatedXP(currentXP);
        }
      }, duration / steps);

      // Hide gain animation after 3 seconds
      const hideTimer = setTimeout(() => {
        setShowGainAnimation(false);
      }, 3000);

      return () => {
        clearInterval(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [recentXPGain, currentXP]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <Star className="h-3 w-3 mr-1" />
            Level {level}
          </Badge>
          <span className="text-sm text-gray-600">
            {Math.floor(animatedXP)} XP
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {100 - progressXP} XP to next level
        </span>
      </div>

      <div className="relative">
        <Progress 
          value={progressPercentage} 
          className="h-3 bg-gray-200"
        />
        
        {/* XP Gain Animation */}
        <AnimatePresence>
          {showGainAnimation && recentXPGain && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -30, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.8 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute right-0 top-0 pointer-events-none"
            >
              <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Zap className="h-3 w-3" />
                +{recentXPGain} XP
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Level up effect */}
      {progressPercentage >= 100 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg opacity-20 pointer-events-none"
        />
      )}
    </div>
  );
}