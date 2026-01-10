import { motion } from "framer-motion";
import {
    BoltIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    PlayIcon,
} from "@heroicons/react/24/outline";
import { useAutoApply } from "../hooks/useAutoApply";

export function AutoApplyToggle() {
    const { stats, settings, isLoading, isLaunching, error, launch } =
        useAutoApply();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Chargement...</span>
            </div>
        );
    }

    const applied = stats?.alreadyAppliedToday || 0;
    const max = stats?.maxApplicationsPerDay || 20;
    const progress = (applied / max) * 100;
    const isLimitReached = applied >= max;
    const mode = settings?.mode || "review";

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gradient-to-r from-primary-900/20 to-secondary-900/20 rounded-lg border border-primary-500/20"
        >
            {/* Stats Badge */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <BoltIcon className="h-5 w-5 text-primary-400" />
                    <span className="text-sm font-medium text-white">
                        Auto-apply
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${
                                isLimitReached
                                    ? "bg-red-500"
                                    : progress > 75
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                            }`}
                        />
                    </div>
                    <span
                        className={`text-sm font-mono ${
                            isLimitReached ? "text-red-400" : "text-gray-300"
                        }`}
                    >
                        {applied}/{max}
                    </span>
                </div>

                {/* Mode Badge */}
                <span
                    className={`text-xs px-2 py-1 rounded-full ${
                        mode === "semi-auto"
                            ? "bg-orange-500/20 text-orange-300"
                            : "bg-blue-500/20 text-blue-300"
                    }`}
                >
                    {mode === "semi-auto" ? "⚡ Semi-auto" : "👁️ Review"}
                </span>
            </div>

            {/* Launch Button */}
            <button
                onClick={launch}
                disabled={isLaunching || isLimitReached}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isLimitReached
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : isLaunching
                        ? "bg-primary-600/50 text-white cursor-wait"
                        : "bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white"
                }`}
            >
                {isLaunching
                    ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Lancement...
                        </>
                    )
                    : isLimitReached
                    ? (
                        <>
                            <CheckCircleIcon className="h-4 w-4" />
                            Limite atteinte
                        </>
                    )
                    : (
                        <>
                            <PlayIcon className="h-4 w-4" />
                            Lancer maintenant
                        </>
                    )}
            </button>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                    <ExclamationCircleIcon className="h-4 w-4" />
                    {error}
                </div>
            )}
        </motion.div>
    );
}
