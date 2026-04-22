import React from 'react';

// 1. Définir l'interface AVANT le composant
interface AnimatedTransitionProps {
  children: React.ReactNode;
  show: boolean;
  type?: 'fade' | 'slide' | 'scale';
  duration?: number;
}

export const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({ 
  children, 
  show, 
  type = 'fade',
  duration = 300 
}) => {
  // Map des durées vers les classes Tailwind
  const durationClasses: Record<number, string> = {
    150: 'duration-150',
    300: 'duration-300',
    500: 'duration-500',
    700: 'duration-700',
  };

  const getAnimationClass = () => {
    if (!show) return 'opacity-0 invisible';
    
    switch (type) {
      case 'slide': return 'animate-slideInUp';
      case 'scale': return 'animate-fadeInScale';
      default: return 'animate-fadeIn';
    }
  };

  return (
    <div className={`transition-all ${durationClasses[duration] || 'duration-300'} ${getAnimationClass()}`}>
      {children}
    </div>
  );
};
