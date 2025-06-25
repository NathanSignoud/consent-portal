export interface Action {
  label: string;
  status: "à faire" | "réalisé";
  date?: string | null; // ISO string ou null si non réalisée
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
