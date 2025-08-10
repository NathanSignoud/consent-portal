import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Action {
  label: string;
  status: "à faire" | "réalisé";
  date?: string | null;
}

export interface Patient2 {
  _id: string;
  nom: string;
  dateNaissance: string;
  sexe: string;
  statutIdentite: string;
  uniteOrganisationnelle?: string;
  ipp?: string;
  situationDossier?: string;
  dateDebutPriseEnCharge?: string;
  dateSortieEffective?: string;
  dateSortiePrevue?: string;
  hopitalProvenance?: string;
  actions?: Action[];
  pathologies?: string[];
}

export const handleExport = async (patients: Patient2[]) => {
  try {
    // Créer une nouvelle instance de jsPDF
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Configuration des couleurs et styles
    const primaryColor: [number, number, number] = [59, 130, 246]; // Bleu
    const secondaryColor: [number, number, number] = [99, 102, 241]; // Indigo
    const successColor: [number, number, number] = [34, 197, 94]; // Vert
    const warningColor: [number, number, number] = [251, 146, 60]; // Orange
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
    doc.text('PORTAIL AIDE SOIGNANT', 40, 25);
    
    // Sous-titre
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Rapport d\'export des patients', 40, 32);
    
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
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('STATISTIQUES GÉNÉRALES', 20, currentY);
    currentY += 10;
    
    const totalPatients = patients.length;
    const totalPathologies = patients.reduce((acc, p) => acc + (p.pathologies?.length || 0), 0);
    
    // Tableau des statistiques - sans les actions
    autoTable(doc, {
      startY: currentY,
      head: [['Métrique', 'Valeur', 'Détails']],
      body: [
        ['Total Patients', totalPatients.toString(), 'Nombre total de patients dans la base'],
        ['Pathologies', totalPathologies.toString(), 'Nombre total de pathologies recensées'],
        ['Unités Représentées', new Set(patients.map(p => p.uniteOrganisationnelle).filter(Boolean)).size.toString(), 'Nombre d\'unités organisationnelles']
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
    
    // Correction: Récupérer la position Y après le tableau
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // === LISTE DÉTAILLÉE DES PATIENTS ===
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('LISTE DÉTAILLÉE DES PATIENTS', 20, currentY);
    currentY += 15;
    
    // Fonction utilitaire pour calculer l'âge
    const calculateAge = (dateNaissance: string): number => {
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
    const formatDate = (dateStr?: string): string => {
      if (!dateStr) return 'Non renseigné';
      return new Date(dateStr).toLocaleDateString('fr-FR');
    };
    
    // Traiter chaque patient
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      
      // Vérifier si on a assez de place sur la page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // === INFORMATIONS PATIENT ===
      doc.setFillColor(...lightGray);
      doc.roundedRect(20, currentY - 5, 170, 8, 1, 1, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...secondaryColor);
      doc.text(`${i + 1}. ${patient.nom.toUpperCase()}`, 22, currentY);
      
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.text(`ID: ${patient._id}`, 150, currentY);
      currentY += 12;
      
      // Informations de base
      const patientInfo = [
        ['Âge', `${calculateAge(patient.dateNaissance)} ans`],
        ['Sexe', patient.sexe],
        ['Statut Identité', patient.statutIdentite],
        ['IPP', patient.ipp || 'Non renseigné'],
        ['Unité', patient.uniteOrganisationnelle || 'Non renseignée'],
        ['Situation', patient.situationDossier || 'Non renseignée']
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [['Information', 'Valeur']],
        body: patientInfo,
        headStyles: {
          fillColor: [99, 102, 241],
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
              fillColor: [34, 197, 94],
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
      
      // === PATHOLOGIES ===
      if (patient.pathologies && patient.pathologies.length > 0) {
        // Préparation des données pour le tableau
        const pathologiesData = patient.pathologies.map((pathology, index) => [
          `${index + 1}.`,
          pathology,
          'Diagnostiquée' // Statut par défaut
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [['N°', 'Pathologies Diagnostiquées', 'Statut']],
          body: pathologiesData,
          headStyles: {
            fillColor: [239, 68, 68],
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
              fillColor: [254, 242, 242] // Rouge très clair
            },
            1: { 
              cellWidth: 120,
              halign: 'left'
            },
            2: { 
              cellWidth: 35,
              halign: 'center',
              fillColor: [240, 253, 244], // Vert très clair
              textColor: [22, 101, 52] // Vert foncé
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