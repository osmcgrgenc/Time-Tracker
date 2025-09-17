'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, Crown, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'levelUp' | 'achievement' | 'streak' | 'perfectDay';
  data: {
    title: string;
    description: string;
    xpGained?: number;
    level?: number;
    streak?: number;
  };
}

const celebrationVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 200, 
      damping: 15,
      duration: 0.6
    }
  },
  exit: { 
    scale: 0, 
    rotate: 180, 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const sparkleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: [0, 1, 0],
    opacity: [0, 1, 0],
    x: [0, Math.cos(i * 0.5) * 100, Math.cos(i * 0.5) * 200],
    y: [0, Math.sin(i * 0.5) * 100, Math.sin(i * 0.5) * 200],
    transition: {
      duration: 2,
      delay: i * 0.1,
      repeat: Infinity,
      repeatDelay: 3
    }
  })
};

export function CelebrationModal({ isOpen, onClose, type, data }: CelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getIcon = () => {
    switch (type) {
      case 'levelUp': return <Crown className="h-12 w-12" />;
      case 'achievement': return <Trophy className="h-12 w-12" />;
      case 'streak': return <Zap className="h-12 w-12" />;
      case 'perfectDay': return <Medal className="h-12 w-12" />;
      default: return <Star className="h-12 w-12" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'levelUp': return 'from-yellow-400 to-orange-500';
      case 'achievement': return 'from-purple-400 to-pink-500';
      case 'streak': return 'from-blue-400 to-cyan-500';
      case 'perfectDay': return 'from-green-400 to-emerald-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-0 bg-transparent shadow-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={celebrationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative"
            >
              {/* Confetti/Sparkles */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={sparkleVariants}
                      initial="hidden"
                      animate="visible"
                      className="absolute top-1/2 left-1/2"
                    >
                      <Star className="h-4 w-4 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Main Content */}
              <div className={`bg-gradient-to-br ${getColors()} p-8 rounded-2xl text-white text-center shadow-2xl`}>
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="flex justify-center mb-4"
                >
                  {getIcon()}
                </motion.div>

                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold mb-2"
                >
                  {data.title}
                </motion.h2>

                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 mb-4"
                >
                  {data.description}
                </motion.p>

                {data.xpGained && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="bg-white/20 rounded-full px-4 py-2 inline-block mb-4"
                  >
                    <span className="font-bold">+{data.xpGained} XP</span>
                  </motion.div>
                )}

                {data.level && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                    className="text-lg font-semibold mb-4"
                  >
                    Level {data.level}!
                  </motion.div>
                )}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button 
                    onClick={onClose}
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Awesome! 🎉
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}