import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../stores/auth";
import { toast } from "react-hot-toast";

/**
 * Bouton d'automatisation de candidature.
 * Appelle l'Edge Function jobnexai-submitter de Supabase.
 */

interface AutomatedApplyButtonProps {
  job: any; // Utilisation de any pour simplifier l'intégration avec différents types d'objets job
  disabled?: boolean;
}

const AutomatedApplyButton: React.FC<AutomatedApplyButtonProps> = (
  { job, disabled },
) => {
  const { user } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAutomatedApply = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Vous devez être connecté pour utiliser l'auto-apply");
      return;
    }

    try {
      setIsApplying(true);
      setSuccess(false);

      const { data, error } = await supabase.functions.invoke(
        "jobnexai-submitter",
        {
          body: {
            userId: user.id,
            job: job,
            applicationContent: {
              motivationAnswer:
                "Candidature générée automatiquement via JobNexAI.",
            },
          },
        },
      );

      if (error) throw error;

      if (data?.success) {
        setSuccess(true);
        toast.success("Candidature envoyée avec succès !");
      } else {
        throw new Error(data?.error || "Erreur lors de l'envoi");
      }
    } catch (error: any) {
      console.error("Error in automated apply:", error);
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <button
      className={`text-sm py-2 px-4 rounded-md font-medium transition-all ${
        success
          ? "bg-green-600/20 text-green-400 border border-green-500/30"
          : "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={handleAutomatedApply}
      disabled={isApplying || success || disabled}
    >
      {isApplying
        ? (
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Envoi...
          </span>
        )
        : success
        ? (
          "✅ Envoyée"
        )
        : (
          "🤖 Auto-apply"
        )}
    </button>
  );
};

export default AutomatedApplyButton;
