import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient2, PatientAction, formatDateForDisplay } from '@/types';

// Interface pour les options d'export
export interface ExportOptions {
  includeActions?: boolean;
  includePathologies?: boolean;
  includeStatistics?: boolean;
  dateRange?: {
    from?: string;
    to?: string;
  };
  title?: string;
}

// Interface pour les statistiques
interface ExportStatistics {
  totalPatients: number;
  totalActions: number;
  completedActions: number;
  pendingActions: number;
  totalPathologies: number;
  unitsCount: number;
  icnpInterventionsCount: number;
}

// Fonction pour calculer les statistiques
const calculateStatistics = (patients: Patient2[]): ExportStatistics => {
  const totalPatients = patients.length;
  const allActions = patients.flatMap(p => p.actions || []);
  const totalActions = allActions.length;
  const completedActions = allActions.filter(a => a.status === 'réalisé').length;
  const pendingActions = totalActions - completedActions;
  const totalPathologies = patients.reduce((acc, p) => acc + (p.pathologies?.length || 0), 0);
  const unitsCount = new Set(patients.map(p => p.uniteOrganisationnelle).filter(Boolean)).size;
  const icnpInterventionsCount = new Set(allActions.map(a => a.icnp?.id).filter(Boolean)).size;

  return {
    totalPatients,
    totalActions,
    completedActions,
    pendingActions,
    totalPathologies,
    unitsCount,
    icnpInterventionsCount
  };
};

// Fonction pour calculer l'âge
const calculateAge = (dateNaissance: string | Date): number => {
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Fonction pour formater les dates
const formatDate = (dateStr?: string | Date): string => {
  if (!dateStr) return 'Non renseigné';
  return formatDateForDisplay(dateStr);
};

// Fonction pour obtenir la couleur selon le statut
const getStatusColor = (status: string): [number, number, number] => {
  switch (status) {
    case 'réalisé':
      return [34, 197, 94]; // Vert
    case 'à faire':
      return [251, 146, 60]; // Orange
    default:
      return [107, 114, 128]; // Gris
  }
};

// Hook personnalisé pour l'export PDF
export const usePdfExport = () => {
  const exportPatientsToPdf = async (
    patients: Patient2[], 
    options: ExportOptions = {}
  ): Promise<void> => {
    try {
      const {
        includeActions = true,
        includePathologies = true,
        includeStatistics = true,
        title = 'PORTAIL AIDE SOIGNANT'
      } = options;

      // Créer une nouvelle instance de jsPDF
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Configuration des couleurs et styles
      const primaryColor: [number, number, number] = [59, 130, 246]; // Bleu
      const secondaryColor: [number, number, number] = [99, 102, 241]; // Indigo
      const successColor: [number, number, number] = [34, 197, 94]; // Vert
      const warningColor: [number, number, number] = [251, 146, 60]; // Orange
      const errorColor: [number, number, number] = [239, 68, 68]; // Rouge
      const textColor: [number, number, number] = [55, 65, 81]; // Gris foncé
      const lightGray: [number, number, number] = [243, 244, 246]; // Gris clair
      
      let currentY = 20;
      
      // === EN-TÊTE DU DOCUMENT ===
      // Logo/Icône (simulé avec un rectangle coloré)
      doc.setFillColor(...primaryColor);
      doc.roundedRect(20, 15, 12, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('+', 26, 24);
      
      // Titre principal
      doc.setTextColor(...textColor);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 40, 25);
      
      // Sous-titre
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Rapport d\'export des patients avec interventions ICNP', 40, 32);
      
      // Date d'export
      const now = new Date();
      const dateStr = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Généré le ${dateStr}`, 40, 38);
      
      // Ligne de séparation
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.5);
      doc.line(20, 45, 190, 45);
      
      currentY = 55;
      
      // === STATISTIQUES GÉNÉRALES ===
      if (includeStatistics) {
        const stats = calculateStatistics(patients);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('STATISTIQUES GÉNÉRALES', 20, currentY);
        currentY += 10;
        
        // Tableau des statistiques avec actions ICNP
        autoTable(doc, {
          startY: currentY,
          head: [['Métrique', 'Valeur', 'Détails']],
          body: [
            ['Total Patients', stats.totalPatients.toString(), 'Nombre total de patients dans la base'],
            ['Total Actions', stats.totalActions.toString(), 'Nombre total d\'actions planifiées'],
            ['Actions Réalisées', stats.completedActions.toString(), `${((stats.completedActions / Math.max(stats.totalActions, 1)) * 100).toFixed(1)}% du total`],
            ['Actions En Attente', stats.pendingActions.toString(), `${((stats.pendingActions / Math.max(stats.totalActions, 1)) * 100).toFixed(1)}% du total`],
            ['Interventions ICNP', stats.icnpInterventionsCount.toString(), 'Nombre d\'interventions ICNP différentes'],
            ['Pathologies', stats.totalPathologies.toString(), 'Nombre total de pathologies recensées'],
            ['Unités Représentées', stats.unitsCount.toString(), 'Nombre d\'unités organisationnelles']
          ],
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 11,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 10,
            textColor: textColor
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          margin: { left: 20, right: 20 }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // === LISTE DÉTAILLÉE DES PATIENTS ===
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('LISTE DÉTAILLÉE DES PATIENTS', 20, currentY);
      currentY += 15;
      
      // Traiter chaque patient
      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        
        // Vérifier si on a assez de place sur la page
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }
        
        // === INFORMATIONS PATIENT ===
        doc.setFillColor(...lightGray);
        doc.roundedRect(20, currentY - 5, 170, 8, 1, 1, 'F');
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...secondaryColor);
        const patientName = `${patient.nom}${patient.prenom ? ' ' + patient.prenom : ''}`.toUpperCase();
        doc.text(`${i + 1}. ${patientName}`, 22, currentY);
        
        doc.setFontSize(10);
        doc.setTextColor(...textColor);
        doc.text(`ID: ${patient._id}`, 150, currentY);
        currentY += 12;
        
        // Informations de base
        const patientInfo = [
          ['Âge', patient.dateNaissance ? `${calculateAge(patient.dateNaissance)} ans` : 'Non renseigné'],
          ['Sexe', patient.sexe || 'Non renseigné'],
          ['Statut Identité', patient.statutIdentite || 'Non renseigné'],
          ['IPP', patient.ipp || 'Non renseigné'],
          ['Unité', patient.uniteOrganisationnelle || 'Non renseignée'],
          ['Situation', patient.situationDossier || 'Non renseignée']
        ];
        
        autoTable(doc, {
          startY: currentY,
          head: [['Information', 'Valeur']],
          body: patientInfo,
          headStyles: {
            fillColor: secondaryColor,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: textColor
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 130 }
          },
          margin: { left: 20, right: 20 },
          tableWidth: 170
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 5;
        
        // === DATES IMPORTANTES ===
        if (patient.dateDebutPriseEnCharge || patient.dateSortiePrevue || patient.dateSortieEffective) {
          const datesInfo = [];
          if (patient.dateDebutPriseEnCharge) {
            datesInfo.push(['Début prise en charge', formatDate(patient.dateDebutPriseEnCharge)]);
          }
          if (patient.dateSortiePrevue) {
            datesInfo.push(['Sortie prévue', formatDate(patient.dateSortiePrevue)]);
          }
          if (patient.dateSortieEffective) {
            datesInfo.push(['Sortie effective', formatDate(patient.dateSortieEffective)]);
          }
          if (patient.hopitalProvenance) {
            datesInfo.push(['Hôpital provenance', patient.hopitalProvenance]);
          }
          
          if (datesInfo.length > 0) {
            autoTable(doc, {
              startY: currentY,
              head: [['Dates & Provenance', '']],
              body: datesInfo,
              headStyles: {
                fillColor: successColor,
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
              },
              bodyStyles: {
                fontSize: 9,
                textColor: textColor
              },
              columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 110 }
              },
              margin: { left: 20, right: 20 },
              tableWidth: 170
            });
            
            currentY = (doc as any).lastAutoTable.finalY + 5;
          }
        }
        
        // === ACTIONS ICNP ===
        if (includeActions && patient.actions && patient.actions.length > 0) {
          const actionsData = patient.actions.map((action: PatientAction, index: number) => [
            `${index + 1}.`,
            action.icnp?.term?.fr || action.label || 'Action sans nom',
            action.icnp?.id || 'N/A',
            action.status,
            action.date ? formatDate(action.date) : 'Non planifiée',
            action.notes || '-'
          ]);
          
          autoTable(doc, {
            startY: currentY,
            head: [['N°', 'Intervention ICNP', 'Code', 'Statut', 'Date', 'Notes']],
            body: actionsData,
            headStyles: {
              fillColor: [139, 69, 19], // Marron pour les actions
              textColor: [255, 255, 255],
              fontSize: 9,
              fontStyle: 'bold',
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 8,
              textColor: textColor,
              valign: 'middle'
            },
            columnStyles: {
              0: { 
                cellWidth: 12, 
                halign: 'center',
                fontStyle: 'bold'
              },
              1: { 
                cellWidth: 60,
                halign: 'left'
              },
              2: { 
                cellWidth: 20,
                halign: 'center',
                fontSize: 7
              },
              3: { 
                cellWidth: 25,
                halign: 'center',
                fontStyle: 'bold'
              },
              4: { 
                cellWidth: 25,
                halign: 'center'
              },
              5: { 
                cellWidth: 28,
                halign: 'left',
                fontSize: 7
              }
            },
            didParseCell: (data) => {
              // Colorer les statuts
              if (data.column.index === 3) {
                const status = data.cell.text[0];
                const color = getStatusColor(status);
                data.cell.styles.fillColor = color;
                data.cell.styles.textColor = [255, 255, 255];
              }
            },
            alternateRowStyles: {
              fillColor: [249, 250, 251]
            },
            margin: { left: 20, right: 20 },
            tableWidth: 170,
            theme: 'grid',
            styles: {
              lineColor: [229, 231, 235],
              lineWidth: 0.3
            }
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 5;
        }
        
        // === PATHOLOGIES ===
        if (includePathologies && patient.pathologies && patient.pathologies.length > 0) {
          const pathologiesData = patient.pathologies.map((pathology, index) => [
            `${index + 1}.`,
            pathology,
            'Diagnostiquée'
          ]);
          
          autoTable(doc, {
            startY: currentY,
            head: [['N°', 'Pathologies Diagnostiquées', 'Statut']],
            body: pathologiesData,
            headStyles: {
              fillColor: errorColor,
              textColor: [255, 255, 255],
              fontSize: 10,
              fontStyle: 'bold',
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 9,
              textColor: textColor,
              valign: 'middle'
            },
            columnStyles: {
              0: { 
                cellWidth: 15, 
                halign: 'center',
                fontStyle: 'bold',
                fillColor: [254, 242, 242]
              },
              1: { 
                cellWidth: 120,
                halign: 'left'
              },
              2: { 
                cellWidth: 35,
                halign: 'center',
                fillColor: [240, 253, 244],
                textColor: [22, 101, 52]
              }
            },
            alternateRowStyles: {
              fillColor: [249, 250, 251]
            },
            margin: { left: 20, right: 20 },
            tableWidth: 170,
            theme: 'grid',
            styles: {
              lineColor: [229, 231, 235],
              lineWidth: 0.5
            }
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 5;
        }
        
        // Ligne de séparation entre patients
        if (i < patients.length - 1) {
          doc.setDrawColor(...lightGray);
          doc.setLineWidth(0.3);
          doc.line(20, currentY, 190, currentY);
          currentY += 10;
        }
      }
      
      // === PIED DE PAGE ===
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Ligne de pied de page
        doc.setDrawColor(...lightGray);
        doc.setLineWidth(0.5);
        doc.line(20, 280, 190, 280);
        
        // Texte du pied de page
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        doc.text('Portail Aide Soignant - Rapport confidentiel', 20, 285);
        doc.text(`Page ${i} sur ${pageCount}`, 190, 285, { align: 'right' });
        doc.text(`Généré le ${dateStr}`, 105, 290, { align: 'center' });
      }
      
      // === TÉLÉCHARGEMENT ===
      const fileName = `patients_export_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.pdf`;
      doc.save(fileName);
      
      // Message de succès
      console.log(`Export réussi: ${patients.length} patients exportés dans ${fileName}`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      throw new Error('Impossible de générer le PDF. Veuillez réessayer.');
    }
  };

  return {
    exportPatientsToPdf
  };
};

// Export de la fonction standalone pour compatibilité
export const handleExport = async (patients: Patient2[], options?: ExportOptions) => {
  const { exportPatientsToPdf } = usePdfExport();
  return exportPatientsToPdf(patients, options);
};