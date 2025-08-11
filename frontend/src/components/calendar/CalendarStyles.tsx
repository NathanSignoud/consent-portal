import React, { memo } from 'react';

// Interface pour les options de style
interface CalendarStylesProps {
  theme?: 'default' | 'medical' | 'healthcare' | 'minimal';
  accentColor?: string;
  completedColor?: string;
  pendingColor?: string;
  patientColor?: string;
  manualColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  showAnimations?: boolean;
}

// Thèmes prédéfinis
const themes = {
  default: {
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    completed: '#10b981',
    pending: '#f59e0b',
    patient: '#0f766e',
    manual: '#2563eb',
    surface: '#f8fafc',
    today: '#dbeafe'
  },
  medical: {
    primary: '#dc2626',
    primaryHover: '#b91c1c',
    completed: '#059669',
    pending: '#d97706',
    patient: '#0891b2',
    manual: '#7c3aed',
    surface: '#fef2f2',
    today: '#fecaca'
  },
  healthcare: {
    primary: '#059669',
    primaryHover: '#047857',
    completed: '#10b981',
    pending: '#f59e0b',
    patient: '#0d9488',
    manual: '#8b5cf6',
    surface: '#f0fdf4',
    today: '#bbf7d0'
  },
  minimal: {
    primary: '#6b7280',
    primaryHover: '#4b5563',
    completed: '#374151',
    pending: '#9ca3af',
    patient: '#6b7280',
    manual: '#4b5563',
    surface: '#ffffff',
    today: '#f3f4f6'
  }
};

// Tailles de police
const fontSizes = {
  small: {
    title: '1.25rem',
    event: '0.7rem',
    axis: '0.7rem',
    timegrid: '0.75rem'
  },
  medium: {
    title: '1.5rem',
    event: '0.75rem',
    axis: '0.75rem',
    timegrid: '0.8rem'
  },
  large: {
    title: '1.75rem',
    event: '0.8rem',
    axis: '0.8rem',
    timegrid: '0.85rem'
  }
};

const CalendarStyles: React.FC<CalendarStylesProps> = ({
  theme = 'default',
  accentColor,
  completedColor,
  pendingColor,
  patientColor,
  manualColor,
  fontSize = 'medium',
  showAnimations = true
}) => {
  const colors = themes[theme];
  const sizes = fontSizes[fontSize];

  const styles = `
    /* ===== STYLES DE BASE FULLCALENDAR ===== */
    .calendar-container .fc-toolbar-title {
      font-size: ${sizes.title} !important;
      font-weight: 600 !important;
      color: #1f2937 !important;
      ${showAnimations ? 'transition: color 0.3s ease !important;' : ''}
    }
    
    .calendar-container .fc-button {
      background: ${accentColor || colors.primary} !important;
      border: none !important;
      border-radius: 8px !important;
      padding: 0.5rem 1rem !important;
      font-weight: 500 !important;
      ${showAnimations ? 'transition: all 0.2s ease !important;' : ''}
    }
    
    .calendar-container .fc-button:hover {
      background: ${accentColor ? `${accentColor}dd` : colors.primaryHover} !important;
      ${showAnimations ? 'transform: translateY(-1px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;' : ''}
    }
    
    .calendar-container .fc-button:focus {
      box-shadow: 0 0 0 3px ${accentColor || colors.primary}40 !important;
    }
    
    .calendar-container .fc-button-active {
      background: ${accentColor || colors.primary} !important;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1) !important;
    }

    /* ===== STYLES DES CELLULES ===== */
    .calendar-container .fc-daygrid-day {
      ${showAnimations ? 'transition: background-color 0.2s ease !important;' : ''}
    }
    
    .calendar-container .fc-daygrid-day:hover {
      background: ${colors.surface} !important;
      ${showAnimations ? 'transform: scale(1.02) !important;' : ''}
    }
    
    .calendar-container .fc-day-today {
      background: ${colors.today} !important;
      font-weight: 600 !important;
      ${showAnimations ? 'box-shadow: inset 0 0 0 2px ' + (accentColor || colors.primary) + '40 !important;' : ''}
    }

    .calendar-container .fc-col-header-cell {
      background: ${colors.surface} !important;
      font-weight: 600 !important;
      border-bottom: 2px solid ${accentColor || colors.primary}20 !important;
      text-transform: uppercase !important;
      font-size: 0.8rem !important;
      letter-spacing: 0.05em !important;
    }

    /* ===== STYLES DES ÉVÉNEMENTS ICNP ===== */
    
    /* Événement patient avec intervention ICNP */
    .patient-event {
      border-left: 4px solid ${patientColor || colors.patient} !important;
      background: linear-gradient(135deg, ${patientColor || colors.patient}15, ${patientColor || colors.patient}05) !important;
      font-weight: 500 !important;
      border-radius: 4px !important;
      ${showAnimations ? 'transition: all 0.2s ease !important;' : ''}
    }
    
    .patient-event:hover {
      ${showAnimations ? 'transform: translateY(-1px) !important; box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;' : ''}
      background: linear-gradient(135deg, ${patientColor || colors.patient}25, ${patientColor || colors.patient}10) !important;
    }

    /* Événement manuel */
    .manual-event {
      border-left: 4px solid ${manualColor || colors.manual} !important;
      background: linear-gradient(135deg, ${manualColor || colors.manual}15, ${manualColor || colors.manual}05) !important;
      font-weight: 500 !important;
      border-radius: 4px !important;
      ${showAnimations ? 'transition: all 0.2s ease !important;' : ''}
    }
    
    .manual-event:hover {
      ${showAnimations ? 'transform: translateY(-1px) !important; box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;' : ''}
      background: linear-gradient(135deg, ${manualColor || colors.manual}25, ${manualColor || colors.manual}10) !important;
    }

    /* Événement terminé */
    .completed-event {
      border-left: 4px solid ${completedColor || colors.completed} !important;
      background: linear-gradient(135deg, ${completedColor || colors.completed}15, ${completedColor || colors.completed}05) !important;
      opacity: 0.8 !important;
      position: relative !important;
    }
    
    .completed-event:before {
      content: '✓' !important;
      position: absolute !important;
      right: 4px !important;
      top: 2px !important;
      font-size: 0.7rem !important;
      color: ${completedColor || colors.completed} !important;
      font-weight: bold !important;
    }

    /* Événement en attente */
    .pending-event {
      border-left: 4px solid ${pendingColor || colors.pending} !important;
      background: linear-gradient(135deg, ${pendingColor || colors.pending}15, ${pendingColor || colors.pending}05) !important;
    }

    /* Événement en retard */
    .overdue-event {
      border-left: 4px solid #dc2626 !important;
      background: linear-gradient(135deg, #dc262615, #dc262605) !important;
      ${showAnimations ? 'animation: pulse-red 2s infinite !important;' : ''}
    }

    /* Événement avec priorité haute */
    .high-priority-event {
      border: 2px solid #dc2626 !important;
      border-left: 6px solid #dc2626 !important;
      box-shadow: 0 0 8px #dc262630 !important;
    }

    /* ===== STYLES DES TEXTES ===== */
    .fc-event-title {
      font-size: ${sizes.event} !important;
      line-height: 1.3 !important;
      font-weight: 500 !important;
    }
    
    .fc-timegrid-event {
      font-size: ${sizes.timegrid} !important;
      border-radius: 4px !important;
    }
    
    .fc-timegrid-event-harness {
      margin: 1px 0 !important;
    }
    
    .fc-timegrid-axis {
      font-size: ${sizes.axis} !important;
      color: #6b7280 !important;
      font-weight: 500 !important;
    }

    /* ===== STYLES POUR LES CODES ICNP ===== */
    .icnp-code {
      font-size: 0.6rem !important;
      color: #6b7280 !important;
      font-weight: 400 !important;
      display: block !important;
      margin-top: 2px !important;
    }

    .icnp-intervention {
      font-weight: 600 !important;
      color: #374151 !important;
    }

    /* ===== BADGES ET INDICATEURS ===== */
    .task-badge {
      position: absolute !important;
      top: 2px !important;
      right: 2px !important;
      width: 8px !important;
      height: 8px !important;
      border-radius: 50% !important;
      z-index: 10 !important;
    }

    .badge-urgent {
      background: #dc2626 !important;
      ${showAnimations ? 'animation: pulse-urgent 1.5s infinite !important;' : ''}
    }

    .badge-icnp {
      background: #8b5cf6 !important;
    }

    .badge-patient {
      background: ${patientColor || colors.patient} !important;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .calendar-container .fc-toolbar-title {
        font-size: 1.25rem !important;
      }
      
      .fc-event-title {
        font-size: 0.7rem !important;
      }
      
      .calendar-container .fc-button {
        padding: 0.4rem 0.8rem !important;
        font-size: 0.8rem !important;
      }
    }

    /* ===== ANIMATIONS ===== */
    ${showAnimations ? `
      @keyframes pulse-red {
        0%, 100% { box-shadow: 0 0 5px #dc262640; }
        50% { box-shadow: 0 0 15px #dc262660; }
      }
      
      @keyframes pulse-urgent {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .fc-event {
        transition: all 0.2s ease !important;
      }
      
      .fc-event:hover {
        z-index: 9999 !important;
        transform: scale(1.05) !important;
      }
    ` : ''}

    /* ===== DARK MODE SUPPORT ===== */
    @media (prefers-color-scheme: dark) {
      .calendar-container .fc-toolbar-title {
        color: #f3f4f6 !important;
      }
      
      .calendar-container .fc-col-header-cell {
        background: #374151 !important;
        color: #f3f4f6 !important;
      }
      
      .calendar-container .fc-daygrid-day:hover {
        background: #374151 !important;
      }
    }

    /* ===== PRINT STYLES ===== */
    @media print {
      .calendar-container .fc-button {
        background: #000 !important;
        color: #fff !important;
      }
      
      .patient-event, .manual-event, .completed-event, .pending-event {
        background: #fff !important;
        border: 1px solid #000 !important;
      }
    }
  `;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: styles
      }}
    />
  );
};

// Composants de thème prédéfinis
export const MedicalCalendarStyles: React.FC<Omit<CalendarStylesProps, 'theme'>> = (props) => (
  <CalendarStyles {...props} theme="medical" />
);

export const HealthcareCalendarStyles: React.FC<Omit<CalendarStylesProps, 'theme'>> = (props) => (
  <CalendarStyles {...props} theme="healthcare" />
);

export const MinimalCalendarStyles: React.FC<Omit<CalendarStylesProps, 'theme'>> = (props) => (
  <CalendarStyles {...props} theme="minimal" />
);

export default memo(CalendarStyles);