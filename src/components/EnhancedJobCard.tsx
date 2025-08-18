import React, { useEffect } from 'react';
import { JobCard } from './ui/job-card';
import { useJobInteractions } from '../hooks/useJobInteractions';

interface Job {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  location: string;
  isRemote: boolean;
  salary: string;
  matchScore: number;
  tags: string[];
}

interface EnhancedJobCardProps {
  job: Job;
  onClick?: () => void;
}

export const EnhancedJobCard: React.FC<EnhancedJobCardProps> = ({ job, onClick }) => {
  const {
    loadInteractions,
    likeJob,
    dislikeJob,
    saveJob,
    markAsViewed,
    isLiked,
    isDisliked,
    isSaved
  } = useJobInteractions();

  useEffect(() => {
    // Charger les interactions pour cette offre
    loadInteractions([job.id]);
  }, [job.id, loadInteractions]);

  const handleClick = () => {
    // Marquer comme vue lors du clic
    markAsViewed(job.id);
    onClick?.();
  };

  const handleLike = async () => {
    try {
      await likeJob(job.id);
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  const handleDislike = async () => {
    try {
      await dislikeJob(job.id);
    } catch (error) {
      console.error('Erreur lors du dislike:', error);
    }
  };

  const handleSave = async () => {
    try {
      await saveJob(job.id);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <JobCard
      title={job.title}
      company={job.company}
      logoUrl={job.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=6366f1&color=fff&size=48`}
      location={job.location}
      isRemote={job.isRemote}
      salary={job.salary}
      matchScore={job.matchScore}
      tags={job.tags}
      favorited={isSaved(job.id)}
      liked={isLiked(job.id)}
      disliked={isDisliked(job.id)}
      onFavorite={handleSave}
      onLike={handleLike}
      onDislike={handleDislike}
      onClick={handleClick}
    />
  );
};
