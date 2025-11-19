import React, { useCallback, useState } from "react";
import type { Job, Profile } from "../types";
import { generateCoverLetterStream } from "../services/geminiService";
import { Header } from "../components/Header";
import { SearchForm } from "../components/SearchForm";
import { LoadingState } from "../components/LoadingState";
import { JobCard } from "../components/JobCard";
import { CoverLetterModal } from "../components/CoverLetterModal";
import { useTranslations } from "../i18n";

// n8n Webhook URL (Production)
const N8N_WEBHOOK_URL = "https://n8n.jobnexai.com/webhook/jobnexai";

const JobSearchStandalone: React.FC = () => {
  const { t, lang } = useTranslations();
  const [profile, setProfile] = useState<Profile>({ summary: "" });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [coverLetterContent, setCoverLetterContent] = useState<string>("");
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState<
    boolean
  >(false);

  const handleSearch = useCallback(
    async (keywords: string, location: string, profileSummary: string) => {
      setIsLoading(true);
      setError(null);
      setJobs([]);
      const currentProfile = { summary: profileSummary };
      setProfile(currentProfile);

      // Setup timeout (180 seconds / 3 minutes for heavy AI workflows with throttling)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        console.log("Calling n8n webhook with:", {
          keywords,
          location,
          profileSummary,
        });

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keywords, location, profileSummary }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Try to parse specific error message from n8n if available
          let errorMessage =
            `Network response was not ok, status: ${response.status}`;

          try {
            const errorData = await response.json();
            // n8n often returns 'errorMessage', 'errorDescription' or 'message' depending on the node failure
            if (errorData) {
              // Prioritize errorDescription as it often contains the specific validation error
              let rawError = errorData.errorDescription ||
                errorData.errorMessage || errorData.message || errorMessage;

              // Detect 504 timeout errors from AI providers (Cloudflare HTML pages)
              if (typeof rawError === "string") {
                // Check if it's HTML (Cloudflare error page)
                if (
                  rawError.includes("<!DOCTYPE html>") ||
                  rawError.includes("<html")
                ) {
                  // Extract meaningful info from HTML if possible
                  if (
                    rawError.includes("Gateway time-out") ||
                    rawError.includes("504")
                  ) {
                    // Check which AI provider timed out
                    const providerMatch = rawError.match(
                      /api\.(mammouth|openai|anthropic|mistral)\.ai/i,
                    );
                    const provider = providerMatch
                      ? providerMatch[1]
                      : "AI provider";

                    rawError = lang === "fr"
                      ? `Le fournisseur d'IA (${provider}) a mis trop de temps à répondre (timeout 504). Réessayez dans quelques minutes ou contactez l'admin pour vérifier la configuration.`
                      : `AI provider (${provider}) timed out (504). Please try again in a few minutes or contact admin to check configuration.`;
                  } else {
                    // Generic HTML error
                    rawError = lang === "fr"
                      ? "Erreur du serveur (HTML retourné au lieu de JSON). Vérifiez la configuration n8n."
                      : "Server error (HTML returned instead of JSON). Check n8n configuration.";
                  }
                } // Clean up ugly Python-dict style errors
                else if (rawError.includes("'error':")) {
                  const match = rawError.match(/'error':\s*['"](.*?)['"]/);
                  if (match && match[1]) rawError = match[1];
                } // Try to extract from JSON string that might be double-encoded
                else if (
                  rawError.trim().startsWith("{") ||
                  rawError.trim().startsWith('"{')
                ) {
                  try {
                    const toParse = rawError.startsWith('"')
                      ? JSON.parse(rawError)
                      : rawError;
                    const parsed = JSON.parse(toParse);
                    if (parsed.error?.message) rawError = parsed.error.message;
                    else if (parsed.error) rawError = String(parsed.error);
                  } catch (e) { /* ignore */ }
                }

                // Clean up common technical prefixes from AI providers
                rawError = rawError.replace(/^\/chat\/completions:\s*/, "");

                // Handle generic "Gateway timed out" from n8n
                if (
                  rawError.toLowerCase().includes("gateway timed out") ||
                  rawError.toLowerCase().includes("gateway time-out")
                ) {
                  rawError = lang === "fr"
                    ? `${rawError}. Le fournisseur d'IA prend trop de temps. Réessayez dans quelques minutes.`
                    : `${rawError}. AI provider is taking too long. Try again in a few minutes.`;
                }
              }
              errorMessage = rawError;
            }
          } catch (e) {
            // JSON parse failed - likely HTML error page
            console.warn("Failed to parse error response as JSON:", e);
            errorMessage = lang === "fr"
              ? `Erreur ${response.status}: Le serveur a retourné une réponse invalide. Vérifiez la configuration n8n.`
              : `Error ${response.status}: Server returned invalid response. Check n8n configuration.`;
          }
          throw new Error(errorMessage);
        }

        const foundJobs: Job[] = await response.json();

        if (!Array.isArray(foundJobs)) {
          // Sometimes n8n returns { json: [...] } wrapper if not formatted correctly
          // @ts-ignore
          if (foundJobs.json && Array.isArray(foundJobs.json)) {
            // @ts-ignore
            setJobs(foundJobs.json);
          } else {
            throw new Error(t("app.invalidResponse"));
          }
        } else {
          setJobs(foundJobs);
        }

        // Save profile to localStorage on successful search to simulate a session
        localStorage.setItem("userProfileSummary", profileSummary);
        localStorage.setItem("lastKeywords", keywords);
        localStorage.setItem("lastLocation", location);
      } catch (err: any) {
        console.error("Failed to fetch jobs from the workflow:", err);

        if (err.name === "AbortError") {
          setError(
            lang === "fr"
              ? "Le délai de recherche a expiré (plus de 3 minutes). L'IA analyse un grand nombre d'offres. Veuillez réessayer avec des critères plus précis."
              : "Search timed out (over 3 minutes). The AI is analyzing a large number of offers. Please try again with more specific criteria.",
          );
        } else {
          // Display the specific error message from n8n if captured, otherwise fallback to generic
          const genericError = t("app.searchError");
          const specificError = err.message && err.message !== "Failed to fetch"
            ? err.message
            : genericError;
          setError(specificError);
        }
        setJobs([]);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    },
    [t, lang],
  );

  const handleGenerateCoverLetter = useCallback(async (job: Job) => {
    setIsGeneratingCoverLetter(true);
    setCoverLetterContent("");
    setIsModalOpen(true);

    try {
      const stream = generateCoverLetterStream(profile, job, lang, t);
      for await (const chunk of stream) {
        setCoverLetterContent((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setCoverLetterContent(t("gemini.errorGenerate"));
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  }, [profile, lang, t]);

  const closeModal = () => {
    setIsModalOpen(false);
    setCoverLetterContent("");
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-slate-400 mb-8 -mt-2">
            {t("header.tagline")}
          </p>
          <SearchForm onSearch={handleSearch} disabled={isLoading} />

          <div className="mt-12">
            {isLoading && <LoadingState />}

            {error && (
              <div className="text-center bg-red-900/20 p-6 rounded-md border border-red-800/50 animate-fade-in">
                <p className="text-red-400 font-medium break-words">{error}</p>
                <button
                  onClick={() =>
                    handleSearch(
                      localStorage.getItem("lastKeywords") || "React Developer",
                      localStorage.getItem("lastLocation") || "Paris",
                      profile.summary,
                    )}
                  className="mt-4 px-4 py-2 bg-red-800/40 hover:bg-red-800/60 text-red-200 text-sm rounded-md transition-colors"
                >
                  {t("app.retry") || (lang === "fr" ? "Réessayer" : "Retry")}
                </button>
              </div>
            )}

            {!isLoading && !error && jobs.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-slate-200">
                  {t("app.topMatches")}
                </h2>
                {jobs.map((job, index) => (
                  <JobCard
                    key={job.url || index}
                    job={job}
                    onGenerateCoverLetter={handleGenerateCoverLetter}
                  />
                ))}
              </div>
            )}

            {!isLoading && !error && jobs.length === 0 && (
              <div className="text-center text-slate-400 py-10">
                <p className="text-lg">{t("app.initialMessage")}</p>
                <p className="text-sm mt-2">{t("app.initialSubMessage")}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <CoverLetterModal
          content={coverLetterContent}
          isLoading={isGeneratingCoverLetter}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default JobSearchStandalone;
