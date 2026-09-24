export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  tier: 'free' | 'plus';
  cvQuotaUsed: number;
  maxFreeQuota: number;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  // snake_case (UserProfileDto)
  full_name?: string;
  cv_quota_used?: number;
  max_free_quota?: number;
}

export interface SkillItem {
  name: string;
  category: string;
  status: 'matched' | 'missing';
  importance: 'high' | 'medium' | 'low';
  advice?: string;
}

export interface ActionPlanItem {
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  learning_resources: string[];
  youtube_search_query?: string;
  youtube_search_url?: string;
}

export interface WorkExperienceItem {
  company: string;
  position: string;
  duration: string;
  location: string;
  achievements: string[];
}

export interface ProjectItem {
  name: string;
  role: string;
  tech_stack: string[];
  highlights: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  duration: string;
  gpa?: string;
  honors?: string;
}

export interface GeneratedCVData {
  full_name: string;
  target_title: string;
  contact: {
    email: string;
    phone: string;
    github?: string;
    linkedin?: string;
    location?: string;
  };
  summary: string;
  core_competencies: string[];
  technical_skills: Record<string, string[]>;
  experience: WorkExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
  ai_enhancement_notes: string[];
}

export interface JobSearchLinks {
  linkedin?: string;
  topcv?: string;
  vietnamworks?: string;
}

export interface CVAnalysis {
  id: number;
  user_id?: number;
  userId?: number;
  originalFilename?: string;
  hasOriginalCv?: boolean;
  fileSizeBytes?: number;
  fileMimeType?: string;
  targetJobTitle: string;
  targetJobDescription?: string;
  atsScore: number;
  assessmentSummary?: string;
  matchedSkills: SkillItem[];
  missingSkills: SkillItem[];
  actionPlan: ActionPlanItem[];
  generatedCvJson: GeneratedCVData;
  jobSearchUrls?: JobSearchLinks;
  createdAt: string;

  // Backward compatibility aliases
  original_filename?: string;
  has_original_cv?: boolean;
  target_job_title?: string;
  ats_score?: number;
  assessment_summary?: string;
  matched_skills?: SkillItem[];
  missing_skills?: SkillItem[];
  action_plan?: ActionPlanItem[];
  generated_cv_json?: GeneratedCVData;
  job_search_urls?: JobSearchLinks;
  created_at?: string;
}

export interface CVAnalysisListItem {
  id: number;
  originalFilename?: string;
  original_filename?: string;
  hasOriginalCv?: boolean;
  has_original_cv?: boolean;
  targetJobTitle: string;
  target_job_title?: string;
  atsScore: number;
  ats_score?: number;
  createdAt: string;
  created_at?: string;
}

export interface QuotaStatus {
  tier: 'free' | 'plus';
  cvQuotaUsed: number;
  maxFreeQuota: number;
  remaining: number | null;
  canAnalyze: boolean;
}

export interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  plusUsers: number;
  totalAnalyses: number;
  totalRevenue: number;
  successfulOrders: number;
}

export interface PaymentOrderRecord {
  id: number;
  txnRef: string;
  amount: number;
  status: string;
  userEmail: string;
  userFullName: string;
  vnpBankCode?: string;
  createdAt: string;
  paidAt?: string;
}
