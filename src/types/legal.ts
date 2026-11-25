export type EventCategory =
  | 'prazo'
  | 'audiencia'
  | 'vencimento'
  | 'assinatura'
  | 'compromisso'
  | 'outro';

export type UrgencyLevel = 'alta' | 'media' | 'baixa';

export interface ExtractedDateItem {
  dateISO: string;
  displayDate: string;
  title: string;
  category: EventCategory;
  isDeadline: boolean;
  urgency: UrgencyLevel;
  actionRequired: string;
}

export interface LegalDocumentAnalysis {
  documentTitle: string;
  documentType: string;
  urgencyLevel: UrgencyLevel;
  plainSummary: string;
  detailedExplanation: string[];
  partiesInvolved: string[];
  extractedDates: ExtractedDateItem[];
  recommendedNextSteps: string[];
  importantNotice: string;
}

export interface CalendarCommitment {
  id: string;
  dateISO: string;
  time?: string;
  title: string;
  category: EventCategory;
  notes?: string;
  completed: boolean;
  sourceDocument?: string;
}

export interface DocumentQAEntry {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
}

export interface SampleLegalDoc {
  id: string;
  title: string;
  type: string;
  fileName: string;
  description: string;
  content: string;
}

export type LegalAreaCategory =
  | 'Todas'
  | 'Consumidor'
  | 'Trabalhista'
  | 'Inquilinato'
  | 'Juizados e Prazos'
  | 'Família';

export interface LegalGuideArticle {
  id: string;
  area: Exclude<LegalAreaCategory, 'Todas'>;
  title: string;
  summary: string;
  typicalDeadline: string;
  explanation: string[];
  practicalSteps: string[];
}

export interface LegalGuidanceAnswer {
  directAnswer: string;
  keyPoints: string[];
  documentsToGather: string[];
  deadlineWarning: string;
  whenToSeekLawyer: string;
}
