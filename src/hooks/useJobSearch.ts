import { useCallback, useEffect, useState } from "react";
import {
    getJobs,
    getJobSuggestions,
    type Job,
    type JobSuggestion,
    supabase,
} from "../lib/supabase";
import { cache } from "../lib/cache";
import { useAuth } from "../stores/auth";
import toast from "react-hot-toast";

export interface JobFilters {
    search: string;
    jobType: string;
    location: string;
    salaryMin: number | "";
    salaryMax: number | "";
    remote: "all" | "remote" | "hybrid" | "onsite";
    experienceLevel: "all" | "junior" | "mid" | "senior";
    sortBy: "date" | "salary";
    currency: string;
}

export function useJobSearch(filters: JobFilters) {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [scrapingLoading, setScrapingLoading] = useState(false);
    const [favorites, setFavorites] = useState<Record<string, boolean>>({});

    const loadJobs = useCallback(async () => {
        try {
            setLoading(true);
            const cacheKey = `jobs:${JSON.stringify(filters)}`;

            const data = await cache.getOrSet<Job[]>(
                cacheKey,
                async () => {
                    const params: any = {
                        search: filters.search,
                        jobType: filters.jobType,
                        location: filters.location,
                        sortBy: filters.sortBy,
                    };

                    if (filters.salaryMin !== "") {
                        params.salaryMin = filters.salaryMin;
                    }
                    if (filters.salaryMax !== "") {
                        params.salaryMax = filters.salaryMax;
                    }
                    if (filters.remote !== "all") {
                        params.remote = filters.remote;
                    }
                    if (filters.experienceLevel !== "all") {
                        params.experienceLevel = filters.experienceLevel;
                    }
                    if (filters.currency) params.currency = filters.currency;

                    return await getJobs(params);
                },
                { ttl: 5 * 60 * 1000 }, // 5 minutes
            );

            setJobs(data || []);

            if (user && data) {
                const { data: userFavorites } = await supabase.from("favorites")
                    .select("job_id").eq("user_id", user.id);
                const favoriteMap = (userFavorites || []).reduce(
                    (acc, fav) => ({ ...acc, [fav.job_id]: true }),
                    {},
                );
                setFavorites(favoriteMap);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des emplois:", error);
            toast.error("Erreur lors du chargement des offres");
        } finally {
            setLoading(false);
        }
    }, [filters, user]);

    const loadSuggestions = useCallback(async () => {
        if (!user) return;
        try {
            const suggestionsData = await getJobSuggestions(user.id);
            setSuggestions(suggestionsData);
        } catch (error) {
            console.error("Erreur lors du chargement des suggestions:", error);
        }
    }, [user]);

    const handleLiveScraping = useCallback(async () => {
        if (!filters.search.trim()) {
            toast.error("Veuillez saisir une recherche");
            return;
        }

        setScrapingLoading(true);

        try {
            const webhookUrl =
                import.meta.env.VITE_N8N_SCRAPING_WEBHOOK_URL ||
                "https://PLACEHOLDER-N8N-WEBHOOK";

            const payload = {
                user_id: user?.id,
            };

            // Fire and forget
            fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }).catch((err) => console.error("Webhook error:", err));

            toast.success(
                "Recherche lancée! Nous cherchons les meilleures offres pour toi...",
            );

            // Poll Supabase
            let pollCount = 0;
            const maxPolls = 450; // 15 minutes

            const pollInterval = setInterval(async () => {
                pollCount++;

                try {
                    const { data, error } = await supabase
                        .from("job_suggestions")
                        .select("*")
                        .eq("user_id", user?.id)
                        .order("created_at", { ascending: false })
                        .limit(1);

                    if (error) throw error;

                    if (data && data.length > 0) {
                        clearInterval(pollInterval);
                        loadSuggestions();
                        toast.success(
                            "Recherche terminée! Résultats disponibles.",
                        );
                        setScrapingLoading(false);
                    }

                    if (pollCount >= maxPolls) {
                        clearInterval(pollInterval);
                        toast(
                            "La recherche prend du temps. Vérifiez plus tard.",
                            { icon: "⏱️" },
                        );
                        setScrapingLoading(false);
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 2000);
        } catch (error) {
            console.error("Erreur lancement scraping:", error);
            toast.error("Erreur lors du lancement de la recherche");
            setScrapingLoading(false);
        }
    }, [filters.search, filters.location, user, loadSuggestions]);

    const toggleFavorite = async (jobId: string) => {
        if (!user) return;

        const isFavorite = favorites[jobId];
        const newFavorites = { ...favorites, [jobId]: !isFavorite };
        setFavorites(newFavorites);

        try {
            if (isFavorite) {
                await supabase.from("favorites").delete().match({
                    user_id: user.id,
                    job_id: jobId,
                });
            } else {
                await supabase.from("favorites").insert({
                    user_id: user.id,
                    job_id: jobId,
                });
            }
        } catch (error) {
            console.error("Erreur favoris:", error);
            setFavorites(favorites); // Revert on error
            toast.error("Erreur lors de la mise à jour des favoris");
        }
    };

    useEffect(() => {
        loadJobs();
        if (user) loadSuggestions();
    }, [loadJobs, loadSuggestions, user]);

    return {
        jobs,
        suggestions,
        loading,
        scrapingLoading,
        favorites,
        toggleFavorite,
        handleLiveScraping,
        refreshJobs: loadJobs,
    };
}
