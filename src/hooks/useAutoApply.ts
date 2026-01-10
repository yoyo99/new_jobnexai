import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../stores/auth";

interface AutoApplyStats {
    alreadyAppliedToday: number;
    maxApplicationsPerDay: number;
}

interface AutoApplySettings {
    maxApplicationsPerDay: number;
    minMatchScore: number;
    mode: "review" | "semi-auto";
    jobTypes: string[];
    countries: string[];
    salaryMin?: number;
}

interface UseAutoApplyReturn {
    stats: AutoApplyStats | null;
    settings: AutoApplySettings | null;
    isLoading: boolean;
    isLaunching: boolean;
    error: string | null;
    launch: () => Promise<void>;
    refetch: () => Promise<void>;
}

const SUPABASE_URL = "https://klwugophjvzctlautsqz.supabase.co";

export function useAutoApply(): UseAutoApplyReturn {
    const { user } = useAuth();
    const [stats, setStats] = useState<AutoApplyStats | null>(null);
    const [settings, setSettings] = useState<AutoApplySettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLaunching, setIsLaunching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch settings from user_settings or user_auto_apply_settings
            const { data: settingsData, error: settingsError } = await supabase
                .from("user_auto_apply_settings")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (settingsError && settingsError.code !== "PGRST116") {
                // PGRST116 = no rows found, which is fine
                console.warn(
                    "Error fetching auto-apply settings:",
                    settingsError,
                );
            }

            const userSettings: AutoApplySettings = settingsData || {
                maxApplicationsPerDay: 20,
                minMatchScore: 0.6,
                mode: "review",
                jobTypes: ["CDI", "Freelance"],
                countries: ["FR"],
            };
            setSettings(userSettings);

            // Fetch today's stats
            const today = new Date().toISOString().split("T")[0];
            const { count, error: countError } = await supabase
                .from("job_applications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("status", "APPLIED_AUTO")
                .gte("created_at", today);

            if (countError) {
                console.warn("Error fetching auto-apply stats:", countError);
            }

            setStats({
                alreadyAppliedToday: count || 0,
                maxApplicationsPerDay: userSettings.maxApplicationsPerDay,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    const launch = useCallback(async () => {
        if (!user?.id) {
            setError("Utilisateur non connecté");
            return;
        }

        setIsLaunching(true);
        setError(null);

        try {
            // Call the n8n webhook via Edge Function or directly
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/jobnexai-api/users/${user.id}/auto-apply`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${
                            (await supabase.auth.getSession()).data.session
                                ?.access_token
                        }`,
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        mode: settings?.mode || "review",
                    }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Échec du lancement de l'auto-apply",
                );
            }

            // Refetch stats after launching
            await fetchData();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Erreur lors du lancement",
            );
        } finally {
            setIsLaunching(false);
        }
    }, [user?.id, settings?.mode, fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Subscribe to realtime updates on job_applications
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel("auto-apply-updates")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "job_applications",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    // Refetch stats when a new application is created
                    fetchData();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchData]);

    return {
        stats,
        settings,
        isLoading,
        isLaunching,
        error,
        launch,
        refetch: fetchData,
    };
}
