
export enum AuditStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED'
}

export interface DetailedReviewItem {
  questionNo: string;
  questionReview: string; 
  observation: string;     
  suggestion: string;      
}

export interface AuditData {
  subject: string;
  examCode: string;
  grade: string;
  semester: string;
  totalQuestions: number;
  reportId: string;
  auditorName: string;
  isAIGeneratedMatrix?: boolean; // Cờ đánh dấu ma trận do AI tự tạo
  questionInventory?: string[];
  overview: {
    scientific: string;
    pedagogical: string;
    accuracy: string;
    matrixAlignment: string;
    improvementSuggestions?: string; // Thêm góp ý nâng cao
  };
  detailedReviews: {
    part1: DetailedReviewItem[];
    part2: DetailedReviewItem[];
    part3: DetailedReviewItem[];
  };
  stats: {
    matrix: LevelStat;
    actual: LevelStat;
  };
  warnings: Warning[];
  auditDate: string;
}

export interface LevelStat {
  nb: number;
  th: number;
  vd: number;
  vdc: number;
}

export interface Warning {
  type: 'error' | 'warning' | 'info';
  message: string;
  questionId?: string;
}

export interface FileState {
  exam: File | null;
  matrix: File | null;
}
