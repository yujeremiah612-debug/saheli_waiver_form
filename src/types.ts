export type LocationType = 'Parker Location' | 'Aurora Location' | 'Centennial Location' | 'Thornton Location' | 'Denver Location';

export interface WaiverSubmission {
  id: string; // generated client-side
  timestamp: string;
  location: LocationType;
  fullName: string;
  phone: string;
  email?: string;
  treatments: string[];
  otherTreatment?: string;
  skinConditions: string[];
  otherSkinCondition?: string;
  usingPeelingAgents: 'Yes' | 'No';
  recentSurgeriesOrPeels: 'Yes' | 'No';
  medicalNotes?: string;
  signatureBase64: string; // captured signature image
  consentAgreed: boolean;
  waiverDate: string;
}

export interface AppConfig {
  appsScriptUrl: string;
  adminPasswordHash?: string;
}
