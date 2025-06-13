export interface UploadedPDF {
  _id: string;
  filename: string;
  path: string;
}

export interface Patient {
  _id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  datePriseEnCharge?: string;
  numeroContact?: string;
  adresse?: string;
  codePostal?: string;
  pathologies?: string[];
  allergies?: string[];
  medication?: string[];
  pdfs?: UploadedPDF[];
}
