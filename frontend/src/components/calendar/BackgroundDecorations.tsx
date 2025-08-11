import React, { memo } from 'react';
import { cn } from '@/lib/utils';

// Interface pour les options de décoration
interface DecorationOptions {
  variant?: 'default' | 'healthcare' | 'medical' | 'soft' | 'dynamic';
  intensity?: 'subtle' | 'normal' | 'vibrant';
  animation?: 'pulse' | 'float' | 'glow' | 'none';
  className?: string;
}

// Variantes de couleurs prédéfinies
const colorVariants = {
  default: [
    'bg-blue-200/20',
    'bg-indigo-200/15', 
    'bg-purple-200/10'
  ],
  healthcare: [
    'bg-emerald-200/20',
    'bg-teal-200/15',
    'bg-green-200/10'
  ],
  medical: [
    'bg-red-200/15',
    'bg-pink-200/10',
    'bg-rose-200/12'
  ],
  soft: [
    'bg-slate-200/10',
    'bg-gray-200/8',
    'bg-neutral-200/12'
  ],
  dynamic: [
    'bg-gradient-to-br from-blue-200/20 to-purple-200/15',
    'bg-gradient-to-tl from-indigo-200/15 to-pink-200/20',
    'bg-gradient-to-r from-emerald-200/10 to-blue-200/15'
  ]
};

// Intensités d'opacité
const intensityMap = {
  subtle: { primary: '/8', secondary: '/6', tertiary: '/4' },
  normal: { primary: '/20', secondary: '/15', tertiary: '/10' },
  vibrant: { primary: '/30', secondary: '/25', tertiary: '/20' }
};

// Animations disponibles
const animationClasses = {
  pulse: 'animate-pulse',
  float: 'animate-bounce',
  glow: 'animate-ping',
  none: ''
};

const BackgroundDecorations: React.FC<DecorationOptions> = ({ 
  variant = 'default',
  intensity = 'normal',
  animation = 'pulse',
  className
}) => {
  const colors = colorVariants[variant];
  const animationClass = animationClasses[animation];

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {/* Décoration principale - Grande sphere en haut à gauche */}
      <div 
        className={cn(
          "absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl",
          variant === 'dynamic' ? colors[0] : `${colors[0].replace(/\/\d+/, intensityMap[intensity].primary)}`,
          animationClass
        )}
        style={{ 
          animationDelay: '0s',
          animationDuration: '4s'
        }}
      />

      {/* Décoration secondaire - Très grande sphere en haut à droite */}
      <div 
        className={cn(
          "absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl",
          variant === 'dynamic' ? colors[1] : `${colors[1].replace(/\/\d+/, intensityMap[intensity].secondary)}`,
          animationClass
        )}
        style={{ 
          animationDelay: '1s',
          animationDuration: '6s'
        }}
      />

      {/* Décoration tertiaire - Sphere en bas au centre */}
      <div 
        className={cn(
          "absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl",
          variant === 'dynamic' ? colors[2] : `${colors[2].replace(/\/\d+/, intensityMap[intensity].tertiary)}`,
          animationClass
        )}
        style={{ 
          animationDelay: '2s',
          animationDuration: '5s'
        }}
      />

      {/* Décorations supplémentaires pour plus de profondeur */}
      {intensity !== 'subtle' && (
        <>
          {/* Petite sphere mobile en haut centre */}
          <div 
            className={cn(
              "absolute top-32 left-1/2 w-48 h-48 rounded-full blur-2xl",
              variant === 'dynamic' ? 'bg-gradient-to-r from-yellow-200/10 to-orange-200/8' : 'bg-amber-200/8',
              animation === 'float' ? 'animate-bounce' : 'animate-pulse'
            )}
            style={{ 
              animationDelay: '3s',
              animationDuration: '7s'
            }}
          />

          {/* Sphere moyenne en bas à droite */}
          <div 
            className={cn(
              "absolute bottom-32 right-1/4 w-64 h-64 rounded-full blur-3xl",
              variant === 'dynamic' ? 'bg-gradient-to-l from-cyan-200/12 to-blue-200/8' : 'bg-cyan-200/10',
              animationClass
            )}
            style={{ 
              animationDelay: '4s',
              animationDuration: '8s'
            }}
          />
        </>
      )}

      {/* Décorations ultra-subtiles pour variante vibrant */}
      {intensity === 'vibrant' && (
        <>
          <div 
            className={cn(
              "absolute top-1/2 left-20 w-32 h-32 rounded-full blur-xl",
              'bg-white/5',
              'animate-pulse'
            )}
            style={{ 
              animationDelay: '5s',
              animationDuration: '3s'
            }}
          />
          
          <div 
            className={cn(
              "absolute top-1/4 right-32 w-40 h-40 rounded-full blur-2xl",
              'bg-white/3',
              'animate-pulse'
            )}
            style={{ 
              animationDelay: '6s',
              animationDuration: '4s'
            }}
          />
        </>
      )}
    </div>
  );
};

// Version avec thème médical spécialisé
export const MedicalBackgroundDecorations: React.FC<Omit<DecorationOptions, 'variant'>> = (props) => (
  <BackgroundDecorations {...props} variant="medical" />
);

// Version avec thème healthcare
export const HealthcareBackgroundDecorations: React.FC<Omit<DecorationOptions, 'variant'>> = (props) => (
  <BackgroundDecorations {...props} variant="healthcare" />
);

// Version dynamique avec gradients
export const DynamicBackgroundDecorations: React.FC<Omit<DecorationOptions, 'variant'>> = (props) => (
  <BackgroundDecorations {...props} variant="dynamic" />
);

// Version minimaliste
export const SubtleBackgroundDecorations: React.FC<Omit<DecorationOptions, 'variant' | 'intensity'>> = (props) => (
  <BackgroundDecorations {...props} variant="soft" intensity="subtle" />
);

// Hook pour changer dynamiquement le thème selon l'heure
export const useTimeBasedTheme = (): DecorationOptions['variant'] => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return 'healthcare'; // Matin - tons verts
  if (hour >= 12 && hour < 18) return 'default';   // Après-midi - tons bleus
  if (hour >= 18 && hour < 22) return 'soft';      // Soirée - tons doux
  return 'medical'; // Nuit - tons chauds
};

// Composant avec thème automatique basé sur l'heure
export const TimeBasedBackgroundDecorations: React.FC<Omit<DecorationOptions, 'variant'>> = (props) => {
  const variant = useTimeBasedTheme();
  return <BackgroundDecorations {...props} variant={variant} />;
};

// Version optimisée avec React.memo
export default memo(BackgroundDecorations);