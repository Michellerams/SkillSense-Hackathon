
export interface Skill {
  name: string;
  category: 'Technical' | 'Soft Skill' | 'Leadership' | 'Language' | 'Other';
  confidence: number;
  evidence: string;
  type?: 'Explicit' | 'Implicit';
}

export interface DataSource {
  name:string;
  content: string; // For text/* this is the string content, for PDF it is base64
  mimeType: string;
}

export enum SkillCategory {
    Technical = 'Technical',
    SoftSkill = 'Soft Skill',
    Leadership = 'Leadership',
    Language = 'Language',
    Other = 'Other',
}

export interface MatchedSkill extends Skill {
    matchStatus: 'matched' | 'missing';
    userConfidence?: number;
}

export interface SuggestedSkill {
  name: string;
  category: SkillCategory;
  reasoning: string;
}

export interface LearningResource {
  title: string;
  platform: string;
  type: 'Course' | 'Certification' | 'Book' | 'Article';
  url: string; // Illustrative URL
}

export interface User {
  name:string;
  surname?: string;
  email?: string;
  avatarUrl: string;
  password?: string;
}

export interface SkillExtractionResponse {
  summary: string;
  skills: Skill[];
}

export enum Trend {
    Emerging = 'Emerging',
    Growing = 'Growing',
    Transformative = 'Transformative',
}

export interface FutureSkill {
  name: string;
  category: SkillCategory;
  trend: Trend;
  reasoning: string;
  impact: string; // Potential impact on the user's career
}