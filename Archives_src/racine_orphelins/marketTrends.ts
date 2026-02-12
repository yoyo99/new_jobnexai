// src/lib/marketTrends.ts

// Define types for market trends data
export interface MarketTrend {
  id: string;
  category: string;
  description: string;
  details: string[];
}

export interface MarketTrendsData {
  skillsInHighDemand: MarketTrend[];
  growingSectors: MarketTrend[];
  salaryTrends: MarketTrend[];
}

// Mock API call to fetch market trends
export const fetchMarketTrends = async (): Promise<MarketTrendsData> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock data for market trends
  const mockData: MarketTrendsData = {
    skillsInHighDemand: [
      {
        id: "skill-1",
        category: "AI/Machine Learning",
        description: "Strong demand for AI and Machine Learning specialists.",
        details: ["Deep Learning", "Natural Language Processing", "Computer Vision"],
      },
      {
        id: "skill-2",
        category: "Cybersecurity",
        description: "Increasing demand for cybersecurity experts.",
        details: ["Penetration Testing", "Threat Intelligence", "Security Architecture"],
      },
      {
        id: "skill-3",
        category: "Cloud Computing",
        description: "High demand for cloud computing professionals.",
        details: ["AWS", "Azure", "Google Cloud Platform"],
      },
    ],
    growingSectors: [
      {
        id: "sector-1",
        category: "Renewable Energy",
        description: "Renewable energy sector is experiencing significant growth.",
        details: ["Solar Energy", "Wind Energy", "Energy Storage"],
      },
      {
        id: "sector-2",
        category: "HealthTech",
        description: "HealthTech sector is rapidly expanding.",
        details: ["Telemedicine", "Digital Health", "Health Data Analytics"],
      },
      {
        id: "sector-3",
        category: "E-commerce",
        description: "E-commerce continues to grow exponentially.",
        details: ["Online Retail", "Logistics", "Digital Marketing"],
      },
    ],
    salaryTrends: [
      {
        id: "salary-1",
        category: "AI/ML Engineers",
        description: "AI/ML Engineers are seeing substantial salary increases.",
        details: ["Average increase of 15% year-over-year", "High demand and limited supply"],
      },
      {
        id: "salary-2",
        category: "Cybersecurity Analysts",
        description: "Cybersecurity Analysts' salaries are on the rise.",
        details: ["Average increase of 12% year-over-year", "Increased threat landscape"],
      },
      {
        id: "salary-3",
        category: "Cloud Architects",
        description: "Cloud Architects are highly compensated.",
        details: ["Average increase of 10% year-over-year", "Cloud adoption across industries"],
      },
    ],
  };

  return mockData;
};