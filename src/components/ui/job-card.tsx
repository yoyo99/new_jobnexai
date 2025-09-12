import { motion } from "framer-motion";
import { BookmarkIcon, BriefcaseIcon, MapPinIcon, StarIcon } from "@heroicons/react/24/solid";

type JobCardProps = {
  title: string;
  company: string;
  logoUrl: string;
  location: string;
  isRemote: boolean;
  salary: string;
  matchScore: number; // 0 - 100
  tags: string[];
  favorited: boolean;
  onFavorite: () => void;
  onClick?: () => void;
};

export const JobCard = ({
  title,
  company,
  logoUrl,
  location,
  isRemote,
  salary,
  matchScore,
  tags,
  favorited,
  onFavorite,
  onClick,
}: JobCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.025, boxShadow: "0 6px 32px 0 rgba(20,20,40,0.10)" }}
      className="group bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-5 flex flex-col gap-3 relative transition cursor-pointer"
      onClick={onClick}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavorite();
        }}
        className="absolute top-4 right-4 z-10"
        aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <BookmarkIcon
          className={`h-6 w-6 ${favorited ? "text-yellow-400" : "text-zinc-300 group-hover:text-yellow-400"} transition`}
        />
      </button>
      
      {/* Logo & Entreprise */}
      <div className="flex items-center gap-3">
        <img
          src={logoUrl}
          alt={company}
          className="h-12 w-12 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800"
          onError={(e) => {
            // Fallback en cas d'erreur de chargement d'image
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=6366f1&color=fff&size=48`;
          }}
        />
        <div>
          <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100">{company}</div>
          <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-sm">
            <BriefcaseIcon className="h-4 w-4 inline" />
            {title}
          </div>
        </div>
      </div>
      
      {/* Lieu & Remote */}
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
        <MapPinIcon className="h-4 w-4" />
        {location} 
        {isRemote && (
          <span className="ml-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-950 rounded text-blue-700 dark:text-blue-300 text-xs">
            Remote
          </span>
        )}
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            {tag}
          </span>
        ))}
        {tags.length > 4 && (
          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300">
            +{tags.length - 4}
          </span>
        )}
      </div>
      
      {/* Bas de carte */}
      <div className="flex items-end justify-between mt-2">
        {/* Match Score animé */}
        <div className="flex items-center gap-2">
          <div className="relative w-16 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${matchScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-700 rounded-full"
            />
          </div>
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
            <StarIcon className="w-4 h-4" /> {matchScore}%
          </span>
        </div>
        <div className="text-zinc-700 dark:text-zinc-200 font-semibold text-sm">{salary}</div>
      </div>
    </motion.div>
  );
};
