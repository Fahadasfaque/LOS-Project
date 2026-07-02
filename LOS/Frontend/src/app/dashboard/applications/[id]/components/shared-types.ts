export interface DocumentItem {
  id: string;
  documentType: 'PAN' | 'AADHAAR' | 'SALARY_SLIP' | 'BANK_STATEMENT';
  originalName: string;
  publicId: string;
  secureUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
}

export interface StatusHistoryItem {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: string;
  changedBy: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface AssessmentDetails {
  id: string;
  status: 'PENDING' | 'COMPLETED';
  creditScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'REJECT';
  assessmentNotes: string;
  assessedBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  assessedAt: string;
}

export interface OfferDetails {
  id: string;
  applicationId: string;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  offerStatus: 'GENERATED' | 'ACCEPTED' | 'DECLINED';
  generatedAt: string;
  acceptedAt: string | null;
  expiresAt: string;
}

export interface DisbursementDetails {
  id: string;
  applicationId: string;
  amount: number;
  referenceNumber: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  disbursedBy: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  disbursedAt: string;
}

export interface ApplicationDetails {
  id: string;
  applicationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  pan: string;
  loanType: string;
  loanAmount: number;
  monthlyIncome: number;
  employmentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  documents: DocumentItem[];
  statusHistory: StatusHistoryItem[];
  userId: string;
  assessment?: AssessmentDetails | null;
  offer?: OfferDetails | null;
  disbursement?: DisbursementDetails | null;
}
