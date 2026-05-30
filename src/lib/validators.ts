import { z } from 'zod';

// ─── Salary Schemas ─────────────────────────────────────────
export const salarySubmitSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required').max(100),
  level: z.string().min(1, 'Level is required'),
  location: z.string().min(1, 'Location is required'),
  currency: z.enum(['INR', 'USD', 'GBP', 'EUR']).default('INR'),
  experienceYears: z.number().int().min(0).max(50),
  baseSalary: z.number().min(0, 'Base salary must be positive'),
  bonus: z.number().min(0).default(0),
  stock: z.number().min(0).default(0),
});

export type SalarySubmitInput = z.infer<typeof salarySubmitSchema>;

export const salaryFilterSchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  level: z.string().optional(),
  location: z.string().optional(),
  minExperience: z.number().int().min(0).optional(),
  maxExperience: z.number().int().max(50).optional(),
  minComp: z.number().min(0).optional(),
  maxComp: z.number().optional(),
  currency: z.enum(['INR', 'USD', 'GBP', 'EUR']).optional(),
  sortBy: z.enum(['totalCompensation', 'baseSalary', 'experienceYears', 'submittedAt']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SalaryFilterInput = z.infer<typeof salaryFilterSchema>;

// ─── Review Schemas ─────────────────────────────────────────
export const reviewSubmitSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  pros: z.string().min(10, 'Please write at least 10 characters for pros').max(2000),
  cons: z.string().min(10, 'Please write at least 10 characters for cons').max(2000),
  rating: z.number().min(1).max(5),
  workLifeBalance: z.number().min(1).max(5),
  culture: z.number().min(1).max(5),
  growth: z.number().min(1).max(5),
  compensation: z.number().min(1).max(5),
  anonymousRole: z.string().max(100).optional(),
});

export type ReviewSubmitInput = z.infer<typeof reviewSubmitSchema>;

// ─── Interview Schemas ──────────────────────────────────────
export const interviewSubmitSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required').max(100),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Very Hard']),
  rounds: z.number().int().min(1).max(20),
  questions: z.string().min(10, 'Please describe the questions').max(5000),
  result: z.enum(['Selected', 'Rejected', 'No Response', 'Ghosted']),
  tips: z.string().max(2000).optional(),
});

export type InterviewSubmitInput = z.infer<typeof interviewSubmitSchema>;

// ─── Search Schema ──────────────────────────────────────────
export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['all', 'company', 'role', 'location']).default('all'),
  limit: z.number().int().min(1).max(50).default(10),
});

export type SearchInput = z.infer<typeof searchSchema>;

// ─── Compare Schema ─────────────────────────────────────────
export const compareSchema = z.object({
  companyA: z.string().min(1),
  companyB: z.string().min(1),
});

export type CompareInput = z.infer<typeof compareSchema>;

// ─── Community Schemas ──────────────────────────────────────
export const communityPostSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  category: z.enum(['general', 'salary', 'interview', 'wlb', 'career', 'rant']).default('general'),
  authorTag: z.string().max(50).optional(),
});

export type CommunityPostInput = z.infer<typeof communityPostSchema>;
