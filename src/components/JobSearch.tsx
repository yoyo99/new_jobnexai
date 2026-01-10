import {
  AdjustmentsHorizontalIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Job } from "../lib/supabase";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "../stores/auth";
import { ShareModal } from "./ShareModal";
import { VirtualizedList } from "./VirtualizedList";
import { LazyImage } from "./LazyImage";
import { LoadingSpinner } from "./LoadingSpinner";
import { type JobFilters, useJobSearch } from "../hooks/useJobSearch";
import {
  AVAILABLE_CURRENCIES,
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  REMOTE_OPTIONS,
} from "../constants/jobFilters";
import { AutoApplyToggle } from "./AutoApplyToggle";

function JobSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Local state for filters
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState<number | "">("");
  const [salaryMax, setSalaryMax] = useState<number | "">("");
  const [remote, setRemote] = useState<"all" | "remote" | "hybrid" | "onsite">(
    "all",
  );
  const [experienceLevel, setExperienceLevel] = useState<
    "all" | "junior" | "mid" | "senior"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "salary">("date");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  // UI state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [shareJob, setShareJob] = useState<Job | null>(null);

  // Derived filters object for the hook
  const filters: JobFilters = useMemo(() => ({
    search,
    jobType,
    location,
    salaryMin,
    salaryMax,
    remote,
    experienceLevel,
    sortBy,
    currency: selectedCurrency,
  }), [
    search,
    jobType,
    location,
    salaryMin,
    salaryMax,
    remote,
    experienceLevel,
    sortBy,
    selectedCurrency,
  ]);

  // Use the custom hook
  const {
    jobs,
    suggestions,
    loading,
    scrapingLoading,
    favorites,
    toggleFavorite,
    handleLiveScraping,
    refreshJobs,
  } = useJobSearch(filters);

  const resetFilters = () => {
    setSearch("");
    setJobType("");
    setLocation("");
    setSalaryMin("");
    setSalaryMax("");
    setRemote("all");
    setExperienceLevel("all");
    setSortBy("date");
    setSelectedCurrency("");
    setShowAdvancedSearch(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshJobs();
  };

  const filteredJobs = useMemo(() => {
    if (showFavoritesOnly) {
      return jobs.filter((job) => favorites[job.id]);
    }
    return jobs;
  }, [jobs, favorites, showFavoritesOnly]);

  const renderJob = useCallback(
    (job: Job, matchScore?: number, matchingSkills?: string[]) => (
      <div
        key={job.id}
        className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 flex flex-col md:flex-row gap-4 hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
        onClick={() => navigate(`/app/jobs/${job.id}`)}
      >
        <LazyImage
          src={job.company_logo || "/placeholder-logo.svg"}
          alt={`${job.company} logo`}
          className="w-12 h-12 object-contain mr-4"
        />
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/app/jobs/${job.id}`);
                }}
                className="text-lg font-bold text-white hover:text-primary-400 transition-colors duration-200 text-left"
              >
                {job.title}
              </button>
              <p className="text-sm text-gray-600">
                {job.company} - {job.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShareJob(job)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => toggleFavorite(job.id)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                {favorites[job.id]
                  ? <HeartIconSolid className="h-6 w-6 text-red-500" />
                  : <HeartIcon className="h-6 w-6" />}
              </button>
            </div>
          </div>
          <p className="text-gray-300 mt-2 text-sm line-clamp-2">
            {job.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <span className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded-full">
              {job.job_type}
            </span>
            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
              {job.experience_level}
            </span>
            {job.remote_type && (
              <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                {job.remote_type}
              </span>
            )}
            {job.salary_min && (
              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                {`${job.salary_min}${
                  job.salary_max ? ` - ${job.salary_max}` : ""
                } ${job.currency || ""}`}
              </span>
            )}
            {job.source_id?.startsWith("n8n-") && (
              <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full flex items-center gap-1">
                <SparklesIcon className="h-3 w-3" />
                Temps réel
              </span>
            )}
          </div>
          {matchScore !== undefined && (
            <div className="mt-2 text-sm text-green-400">
              Score de correspondance : {Math.round(matchScore * 100)}%
              {matchingSkills && (
                <p className="text-xs text-gray-400">
                  Compétences correspondantes : {matchingSkills.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between items-end flex-shrink-0 mt-4 md:mt-0">
          <p className="text-xs text-gray-500">
            {format(new Date(job.created_at), "d MMMM yyyy", { locale: fr })}
          </p>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-2 w-full md:w-auto text-center"
          >
            Voir l'offre
          </a>
        </div>
      </div>
    ),
    [favorites, toggleFavorite, navigate],
  );

  return (
    <>
      <div className="container mx-auto p-4">
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-lg p-6 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white">
              Recherche d'emploi
            </h1>
            <p className="text-lg text-gray-300">
              Trouvez l'opportunité qui vous correspond
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Row 1: Search inputs */}
            <div className="flex flex-col md:flex-row gap-3 mb-3">
              <div className="relative flex-grow">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Poste, compétence, entreprise..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ville, région, pays..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="btn-secondary flex-shrink-0 px-3"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Row 2: Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="btn-primary flex-1 sm:flex-none text-sm"
              >
                📋 Historique
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleLiveScraping();
                  navigate("/app/dashboard/jobs");
                }}
                disabled={scrapingLoading}
                className="btn-secondary flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white text-sm"
              >
                {scrapingLoading
                  ? (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-1 animate-spin" />
                      Recherche...
                    </>
                  )
                  : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      🔥 Live
                    </>
                  )}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-secondary flex-1 sm:flex-none text-sm"
              >
                Réinitialiser
              </button>
            </div>

            {/* Auto-Apply Toggle */}
            <div className="mt-4">
              <AutoApplyToggle />
            </div>

            {showAdvancedSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <div>
                    <label
                      htmlFor="jobType"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Type de contrat
                    </label>
                    <select
                      id="jobType"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {JOB_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="remote"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Télétravail
                    </label>
                    <select
                      id="remote"
                      value={remote}
                      onChange={(e) => setRemote(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {REMOTE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="experienceLevel"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Niveau d'expérience
                    </label>
                    <select
                      id="experienceLevel"
                      value={experienceLevel}
                      onChange={(e) =>
                        setExperienceLevel(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="sortBy"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Trier par
                    </label>
                    <select
                      id="sortBy"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="date">Date de publication</option>
                      <option value="salary">Salaire</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Fourchette de salaire
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={salaryMin}
                        onChange={(e) =>
                          setSalaryMin(
                            e.target.value ? Number(e.target.value) : "",
                          )}
                        placeholder="Min"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        value={salaryMax}
                        onChange={(e) =>
                          setSalaryMax(
                            e.target.value ? Number(e.target.value) : "",
                          )}
                        placeholder="Max"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="currency"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Devise
                    </label>
                    <select
                      id="currency"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {AVAILABLE_CURRENCIES.map((currency) => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFavoritesOnly(!showFavoritesOnly);
                  }}
                  className={`btn-secondary flex items-center gap-2 ${
                    showFavoritesOnly
                      ? "bg-primary-600 hover:bg-primary-500"
                      : ""
                  }`}
                >
                  <HeartIcon className="h-5 w-5" />
                  {showFavoritesOnly ? "Tous les emplois" : "Voir mes favoris"}
                </button>

                {user && suggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className={`btn-secondary flex items-center gap-2 ${
                      showSuggestions
                        ? "bg-primary-600 hover:bg-primary-500"
                        : ""
                    }`}
                  >
                    <SparklesIcon className="h-5 w-5" />
                    Suggestions
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {loading
          ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner
                size="lg"
                text="Chargement des offres d'emploi..."
              />
            </div>
          )
          : (
            <div className="space-y-4">
              {showSuggestions
                ? (
                  suggestions.length > 0
                    ? (
                      <VirtualizedList
                        items={suggestions}
                        height={600}
                        itemHeight={200}
                        renderItem={(suggestion) => (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {renderJob(
                              suggestion.job,
                              suggestion.matchScore,
                              suggestion.matchingSkills,
                            )}
                          </motion.div>
                        )}
                      />
                    )
                    : (
                      <div className="text-center py-12 text-gray-400">
                        Aucune suggestion disponible. Complétez votre profil
                        pour recevoir des suggestions personnalisées.
                      </div>
                    )
                )
                : filteredJobs.length > 0
                ? (
                  <VirtualizedList
                    items={filteredJobs}
                    height={600}
                    itemHeight={200}
                    renderItem={(job) => (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {renderJob(job)}
                      </motion.div>
                    )}
                  />
                )
                : (
                  <div className="text-center py-12 text-gray-400">
                    Aucune offre d'emploi ne correspond à vos critères.
                  </div>
                )}
            </div>
          )}
      </div>

      {shareJob && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareJob(null)}
          job={shareJob}
        />
      )}
    </>
  );
}

export default JobSearch;
