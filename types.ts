export interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: number;
  code?: string;
  metadata?: {
    language?: string;
    topic?: string;
    mistakes?: string[];
    suggestions?: string[];
    challenge?: string;
    recommendation?: string;
  };
}

export interface UserStats {
  language: string;
  weakTopics: string[];
  mistakes: string[];
  progress: number;
  level: string;
}
