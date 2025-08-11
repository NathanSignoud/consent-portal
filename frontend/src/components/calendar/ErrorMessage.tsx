import React, { memo } from 'react';
import { 
  AlertCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiErrorResponse, ValidationError } from '@/types';

// Types de messages d'erreur
type MessageVariant = 'error' | 'warning' | 'info' | 'success';

// Interface pour les props du composant
interface ErrorMessageProps {
  // Props legacy (rétrocompatibilité)
  error?: string;
  
  // Nouvelles props modernes
  message?: string;
  variant?: MessageVariant;
  title?: string;
  details?: ApiErrorResponse | null;
  validationErrors?: ValidationError[];
  
  // Actions optionnelles
  onRetry?: () => void;
  onDismiss?: () => void;
  onViewDetails?: () => void;
  
  // Personnalisation
  showTimestamp?: boolean;
  showErrorCode?: boolean;
  showRetryButton?: boolean;
  showDismissButton?: boolean;
  isRetrying?: boolean;
  autoHide?: number; // en secondes
  
  // Style
  className?: string;
  compact?: boolean;
}

// Configuration des variantes
const variantConfig = {
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50/80',
    borderColor: 'border-red-200/50',
    iconColor: 'text-red-600',
    textColor: 'text-red-800',
    titleColor: 'text-red-900',
    buttonColor: 'bg-red-600 hover:bg-red-700'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50/80',
    borderColor: 'border-yellow-200/50',
    iconColor: 'text-yellow-600',
    textColor: 'text-yellow-800',
    titleColor: 'text-yellow-900',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50/80',
    borderColor: 'border-blue-200/50',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-800',
    titleColor: 'text-blue-900',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  },
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50/80',
    borderColor: 'border-green-200/50',
    iconColor: 'text-green-600',
    textColor: 'text-green-800',
    titleColor: 'text-green-900',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  }
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  // Props legacy
  error,
  
  // Nouvelles props
  message,
  variant = 'error',
  title,
  details,
  validationErrors,
  onRetry,
  onDismiss,
  onViewDetails,
  showTimestamp = false,
  showErrorCode = true,
  showRetryButton = false,
  showDismissButton = false,
  isRetrying = false,
  autoHide,
  className = '',
  compact = false
}) => {
  // Détermine le message à afficher (legacy d'abord pour compatibilité)
  const displayMessage = error || message;
  
  // Auto-hide après le délai spécifié
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, autoHide * 1000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss]);

  // Ne rien afficher si pas de message
  if (!displayMessage && !details && (!validationErrors || validationErrors.length === 0)) {
    return null;
  }

  const config = variantConfig[variant];
  const IconComponent = config.icon;

  // Fonction pour formater le timestamp
  const formatTimestamp = () => {
    return new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mode compact pour les erreurs simples
  if (compact) {
    return (
      <div className={`
        flex items-center gap-2 p-3 ${config.bgColor} backdrop-blur-sm 
        border ${config.borderColor} rounded-lg ${className}
      `}>
        <IconComponent className={`w-4 h-4 ${config.iconColor} flex-shrink-0`} />
        <p className={`text-sm ${config.textColor} flex-1`}>
          {displayMessage}
        </p>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className={`h-6 w-6 p-0 ${config.textColor} hover:bg-white/20`}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <Alert className={`${config.bgColor} backdrop-blur-sm border ${config.borderColor} rounded-xl`}>
        <div className="flex items-start gap-3">
          <IconComponent className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          
          <div className="flex-1 min-w-0">
            {/* Titre et timestamp */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {title && (
                  <AlertTitle className={`text-base font-semibold ${config.titleColor}`}>
                    {title}
                  </AlertTitle>
                )}
                {showTimestamp && (
                  <Badge variant="outline" className="text-xs">
                    {formatTimestamp()}
                  </Badge>
                )}
              </div>
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className={`h-6 w-6 p-0 ${config.textColor} hover:bg-white/20`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Message principal */}
            {displayMessage && (
              <AlertDescription className={`${config.textColor} font-medium mb-2`}>
                {displayMessage}
              </AlertDescription>
            )}

            {/* Détails de l'erreur API */}
            {details && (
              <div className="space-y-2 mb-3">
                {details.code && showErrorCode && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {details.code}
                    </Badge>
                    {details.timestamp && (
                      <span className="text-xs opacity-75">
                        {new Date(details.timestamp).toLocaleString('fr-FR')}
                      </span>
                    )}
                  </div>
                )}
                
                {details.path && (
                  <p className="text-xs opacity-75 font-mono">
                    {details.method} {details.path}
                  </p>
                )}
              </div>
            )}

            {/* Erreurs de validation */}
            {validationErrors && validationErrors.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-2">Erreurs de validation :</p>
                <ul className="space-y-1">
                  {validationErrors.map((err, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="font-medium text-xs bg-white/50 px-2 py-1 rounded">
                        {err.field}
                      </span>
                      <span className="flex-1">{err.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {showRetryButton && onRetry && (
                <Button
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className={`${config.buttonColor} text-white`}
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Retry...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Réessayer
                    </>
                  )}
                </Button>
              )}
              
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewDetails}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Détails
                </Button>
              )}
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
};

// Composants de variantes pour faciliter l'usage
export const ErrorAlert: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => (
  <ErrorMessage {...props} variant="error" />
);

export const WarningAlert: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => (
  <ErrorMessage {...props} variant="warning" />
);

export const InfoAlert: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => (
  <ErrorMessage {...props} variant="info" />
);

export const SuccessAlert: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => (
  <ErrorMessage {...props} variant="success" />
);

// Hook pour gérer les erreurs temporaires
export const useTemporaryMessage = (duration: number = 5) => {
  const [message, setMessage] = React.useState<{
    text: string;
    variant: MessageVariant;
    details?: ApiErrorResponse;
  } | null>(null);

  const showMessage = React.useCallback((
    text: string, 
    variant: MessageVariant = 'info',
    details?: ApiErrorResponse
  ) => {
    setMessage({ text, variant, details });
  }, []);

  const hideMessage = React.useCallback(() => {
    setMessage(null);
  }, []);

  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(hideMessage, duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [message, duration, hideMessage]);

  return {
    message,
    showMessage,
    hideMessage,
    showError: (text: string, details?: ApiErrorResponse) => showMessage(text, 'error', details),
    showWarning: (text: string) => showMessage(text, 'warning'),
    showInfo: (text: string) => showMessage(text, 'info'),
    showSuccess: (text: string) => showMessage(text, 'success')
  };
};

export default memo(ErrorMessage);