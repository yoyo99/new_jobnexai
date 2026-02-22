import React from "react";
import type { Job } from "../types";
import { useTranslations } from "../i18n";

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
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
          <p className="text-blue-400 font-medium">{job.company}</p>
          <p className="text-slate-400 text-sm mt-1">📍 {job.location}</p>
        </div>
        {job.company_logo && (
          <img
            src={job.company_logo}
            alt={job.company}
            className="w-16 h-16 rounded object-cover ml-4"
          />
        )}
      </div>

      {job.description && (
        <p className="text-slate-300 text-sm line-clamp-3 mb-4">
          {job.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {job.job_type && (
          <span className="px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full">
            {job.job_type}
          </span>
        )}
        {job.remote_type && (
          <span className="px-3 py-1 bg-green-900/30 text-green-300 text-xs rounded-full">
            {job.remote_type}
          </span>
        )}
        {job.experience_level && (
          <span className="px-3 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-full">
            {job.experience_level}
          </span>
        )}
        {job.salary_min && job.salary_max && (
          <span className="px-3 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded-full">
            {job.salary_min.toLocaleString()} -{" "}
            {job.salary_max.toLocaleString()} {job.currency || "EUR"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded-md transition-colors font-medium text-sm"
        >
          {t("job.viewDetails") || "View Details"}
        </a>
        <button
          onClick={() =>
            onGenerateCoverLetter(job)}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-md transition-colors font-medium text-sm"
        >
          {t("job.generateLetter") || "Generate Letter"}
        </button>
        <div className="flex-1">
          <AutomatedApplyButton job={job} />
        </div>
      </div>

      <p className="text-slate-500 text-xs mt-3">
        Posted: {new Date(job.posted_at).toLocaleDateString()}
      </p>
    </div>
  );
};
