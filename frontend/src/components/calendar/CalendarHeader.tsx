import React, { memo, useMemo } from 'react';
import { 
  Calendar, 
  Star, 
  CheckCircle, 
  Clock, 
  User, 
  Users, 
  TrendingUp,
  Activity,
  MapPin,
  AlertTriangle,
  Target,
  Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TaskSummary } from '@/types';

// Interface pour les props de base (rétrocompatibilité)
interface CalendarHeaderProps {
  // Props legacy
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  manualTasks?: number;
  patientTasks?: number;
  
  // Nouvelles props modernes
  summary?: TaskSummary;
  userName?: string;
  selectedDate?: string;
  showProgressBar?: boolean;
  showTrendIndicator?: boolean;
  
  // Props pour les nouvelles métriques
  icnpInterventionsCount?: number;
  patientsWithTasksCount?: number;
  overdueTasksCount?: number;
  todayTasksCount?: number;
  
  // Personnalisation
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

// Interface pour une carte de métrique
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  trend?: number; // Pourcentage de changement
  subtitle?: string;
  isLoading?: boolean;
}

// Composant pour une carte de métrique
const MetricCard: React.FC<MetricCardProps> = memo(({ 
  icon, 
  label, 
  value, 
  color, 
  bgColor, 
  trend, 
  subtitle,
  isLoading = false 
}) => (
  <div className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
    <div className="flex items-center gap-3">
      <div className={`p-2 ${bgColor} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-600">{label}</p>
          {trend !== undefined && (
            <Badge 
              variant={trend >= 0 ? "default" : "destructive"} 
              className="text-xs"
            >
              {trend >= 0 ? '+' : ''}{trend}%
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          {isLoading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
          ) : (
            <p className={`text-2xl font-bold ${color} transition-colors duration-200`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  </div>
));

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ 
  // Props legacy (rétrocompatibilité)
  totalTasks = 0,
  completedTasks = 0,
  pendingTasks = 0,
  manualTasks = 0,
  patientTasks = 0,
  
  // Nouvelles props
  summary,
  userName,
  selectedDate,
  showProgressBar = true,
  showTrendIndicator = false,
  icnpInterventionsCount = 0,
  patientsWithTasksCount = 0,
  overdueTasksCount = 0,
  todayTasksCount = 0,
  variant = 'default',
  className = ''
}) => {
  // Utiliser les données du summary si disponibles, sinon fallback sur les props
  const stats = useMemo(() => {
    if (summary) {
      return {
        total: summary.total,
        completed: summary.completed,
        pending: summary.pending,
        // Calculs additionnels depuis le summary
        completionRate: summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0
      };
    }
    
    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [summary, totalTasks, completedTasks, pendingTasks]);

  // Formatage de la date sélectionnée
  const formattedDate = useMemo(() => {
    if (!selectedDate) return "Aujourd'hui";
    try {
      const date = new Date(selectedDate);
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Calcul des trends (exemple - à adapter selon vos données)
  const trends = useMemo(() => ({
    total: showTrendIndicator ? Math.floor(Math.random() * 20 - 10) : undefined,
    completed: showTrendIndicator ? Math.floor(Math.random() * 30) : undefined,
    pending: showTrendIndicator ? Math.floor(Math.random() * 20 - 10) : undefined
  }), [showTrendIndicator]);

  if (variant === 'compact') {
    return (
      <div className={`mb-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
              <p className="text-sm text-gray-600">{formattedDate}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Progression</p>
              <p className="text-lg font-bold text-blue-600">{stats.completionRate}%</p>
            </div>
            <Progress value={stats.completionRate} className="w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-8 ${className}`}>
      {/* En-tête principal */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Planning des Interventions ICNP
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-600">
              {userName ? `Bonjour ${userName}, ` : ''}organisez vos interventions pour {formattedDate.toLowerCase()}
            </p>
            {overdueTasksCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {overdueTasksCount} en retard
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Barre de progression globale */}
      {showProgressBar && stats.total > 0 && (
        <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression journalière</span>
            <span className="text-sm text-gray-600">
              {stats.completed} / {stats.total} interventions
            </span>
          </div>
          <Progress 
            value={stats.completionRate} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">{stats.completionRate}% complété</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <MetricCard
          icon={<Star className="w-5 h-5 text-blue-600" />}
          label="Total interventions"
          value={stats.total}
          color="text-blue-600"
          bgColor="bg-blue-100"
          trend={trends.total}
          subtitle="toutes sources"
        />

        <MetricCard
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          label="Terminées"
          value={stats.completed}
          color="text-green-600"
          bgColor="bg-green-100"
          trend={trends.completed}
          subtitle={`${stats.completionRate}% du total`}
        />

        <MetricCard
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          label="En attente"
          value={stats.pending}
          color="text-orange-600"
          bgColor="bg-orange-100"
          trend={trends.pending}
          subtitle="à planifier"
        />

        <MetricCard
          icon={<User className="w-5 h-5 text-purple-600" />}
          label="Manuelles"
          value={manualTasks}
          color="text-purple-600"
          bgColor="bg-purple-100"
          subtitle="hors patient"
        />

        <MetricCard
          icon={<Users className="w-5 h-5 text-teal-600" />}
          label="Patients"
          value={patientTasks}
          color="text-teal-600"
          bgColor="bg-teal-100"
          subtitle="avec actions"
        />
      </div>

      {/* Métriques détaillées (mode detailed) */}
      {variant === 'detailed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<Activity className="w-5 h-5 text-indigo-600" />}
            label="Interventions ICNP"
            value={icnpInterventionsCount}
            color="text-indigo-600"
            bgColor="bg-indigo-100"
            subtitle="types différents"
          />

          <MetricCard
            icon={<MapPin className="w-5 h-5 text-cyan-600" />}
            label="Patients concernés"
            value={patientsWithTasksCount}
            color="text-cyan-600"
            bgColor="bg-cyan-100"
            subtitle="avec planning"
          />

          <MetricCard
            icon={<Target className="w-5 h-5 text-red-600" />}
            label="Aujourd'hui"
            value={todayTasksCount}
            color="text-red-600"
            bgColor="bg-red-100"
            subtitle="interventions prévues"
          />

          <MetricCard
            icon={<Award className="w-5 h-5 text-yellow-600" />}
            label="Taux de réussite"
            value={`${stats.completionRate}%`}
            color="text-yellow-600"
            bgColor="bg-yellow-100"
            subtitle="cette semaine"
          />
        </div>
      )}

      {/* Indicateurs de performance */}
      {showTrendIndicator && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Performance cette semaine</p>
            <p className="text-xs text-blue-700">
              +12% d'interventions complétées par rapport à la semaine dernière
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Excellent
          </Badge>
        </div>
      )}
    </div>
  );
};

// Export des variantes pour faciliter l'usage
export const CompactCalendarHeader: React.FC<Omit<CalendarHeaderProps, 'variant'>> = (props) => (
  <CalendarHeader {...props} variant="compact" />
);

export const DetailedCalendarHeader: React.FC<Omit<CalendarHeaderProps, 'variant'>> = (props) => (
  <CalendarHeader {...props} variant="detailed" />
);

export default memo(CalendarHeader);