export interface SkillDemand {
  skill: string;
  demandLevel: 'high' | 'medium' | 'low';
  description: string;
}

export interface SectorGrowth {
  sector: string;
  growthRate: number;
  description: string;
}

export interface SalaryTrend {
  jobTitle: string;
  averageSalary: number;
  salaryRange: {
    min: number;
    max: number;
  };
  location?: string;
}

export interface MarketTrend {
  id: string;
  date: Date;
  skillDemands: SkillDemand[];
  sectorGrowths: SectorGrowth[];
  salaryTrends: SalaryTrend[];
}