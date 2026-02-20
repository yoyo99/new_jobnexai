import React from "react";
import type { Job } from "../types";
import { useTranslations } from "../i18n";
import { Button } from "./ui/button";
import AutomatedApplyButton from "./AutomatedApplyButton";

interface JobCardProps {
  job: Job;
  onGenerateCoverLetter: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = (
  { job, onGenerateCoverLetter },
) => {
  const { t } = useTranslations();

  return (
    <article
      className="bg-slate-800 rounded-lg p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-700"
      aria-labelledby={`job-title-${job.id}`}
    >
      {/* Header - responsive flex direction */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3
            id={`job-title-${job.id}`}
            className="text-lg sm:text-xl font-bold text-white mb-1 truncate"
          >
            {job.title}
          </h3>
          <p className="text-primary-400 font-medium text-sm sm:text-base">{job.company}</p>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            <span aria-hidden="true">📍</span>
            <span className="sr-only">{t("job.location")}:</span> {job.location}
          </p>
        </div>
        {job.company_logo && (
          <img
            src={job.company_logo}
            alt={`${job.company} logo`}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded object-cover self-start"
            loading="lazy"
          />
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-slate-300 text-xs sm:text-sm line-clamp-3 mb-4">
          {job.description}
        </p>
      )}

      {/* Tags - responsive wrapping */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4" role="list" aria-label={t("job.tags")}>
        {job.job_type && (
          <span role="listitem" className="px-2 sm:px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full">
            {job.job_type}
          </span>
        )}
        {job.remote_type && (
          <span role="listitem" className="px-2 sm:px-3 py-1 bg-green-900/30 text-green-300 text-xs rounded-full">
            {job.remote_type}
          </span>
        )}
        {job.experience_level && (
          <span role="listitem" className="px-2 sm:px-3 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-full">
            {job.experience_level}
          </span>
        )}
        {job.salary_min && job.salary_max && (
          <span role="listitem" className="px-2 sm:px-3 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded-full">
            {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.currency || "EUR"}
          </span>
        )}
      </div>

      {/* Actions - stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1 min-h-[44px]"
          asChild
        >
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("job.viewDetails")} - ${job.title} ${t("job.opensInNewTab")}`}
          >
            {t("job.viewDetails")}
          </a>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 min-h-[44px]"
          onClick={() => onGenerateCoverLetter(job)}
        >
          {t("job.generateLetter")}
        </Button>
        <div className="flex-1 min-h-[44px]">
          <AutomatedApplyButton job={job} />
        </div>
      </div>

      {/* Footer */}
      <p className="text-slate-500 text-xs mt-3">
        <time dateTime={job.posted_at}>
          {t("job.posted")}: {new Date(job.posted_at).toLocaleDateString()}
        </time>
      </p>
    </article>
  );
};
