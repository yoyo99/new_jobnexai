export const JOB_TYPES = [
    { value: "", label: "Tous les types" },
    { value: "FULL_TIME", label: "Temps plein" },
    { value: "PART_TIME", label: "Temps partiel" },
    { value: "CONTRACT", label: "Contrat / Mission" },
    { value: "FREELANCE", label: "Freelance" },
    { value: "INTERNSHIP", label: "Stage" },
] as const;

export const REMOTE_OPTIONS = [
    { value: "all", label: "Tous modes" },
    { value: "remote", label: "Télétravail complet" },
    { value: "hybrid", label: "Hybride" },
    { value: "onsite", label: "Sur site" },
] as const;

export const EXPERIENCE_LEVELS = [
    { value: "all", label: "Tous niveaux" },
    { value: "junior", label: "Junior (0-2 ans)" },
    { value: "mid", label: "Confirmé (3-5 ans)" },
    { value: "senior", label: "Senior (5+ ans)" },
] as const;

export const AVAILABLE_CURRENCIES = [
    { value: "", label: "Toutes les devises" },
    { value: "EUR", label: "EUR (€) - Euro" },
    { value: "USD", label: "USD ($) - Dollar américain" },
    { value: "CAD", label: "CAD (C$) - Dollar canadien" },
    { value: "GBP", label: "GBP (£) - Livre sterling" },
    { value: "CHF", label: "CHF (Fr) - Franc suisse" },
] as const;

export type JobType = typeof JOB_TYPES[number]["value"];
export type RemoteOption = typeof REMOTE_OPTIONS[number]["value"];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number]["value"];
export type Currency = typeof AVAILABLE_CURRENCIES[number]["value"];
