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
    actions?: string[];
    pathologies?: string[];
  }
  