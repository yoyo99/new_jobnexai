/**
 * src/lib/matching.ts
 *
 * Ce fichier contient la logique pour la fonctionnalité de matching de compétences prédictif.
 */

/**
 * @param user_profile - Profil de l'utilisateur au format string.
 * @param job_offers - Liste des offres d'emploi au format string.
 * @returns Liste des offres d'emploi correspondantes au profil de l'utilisateur.
 */
export function predictiveSkillMatching(user_profile: string, job_offers: string[]): string[] {
  // Pour cette première version, nous allons faire une correspondance de base.
  // Nous allons simplement vérifier si le profil de l'utilisateur contient des mots clés présents dans l'offre d'emploi.
  const matchedJobs: string[] = [];
  if (!user_profile || job_offers.length === 0) {
    return [];
  }

  const userProfileKeywords = user_profile.toLowerCase().split(" ");

  for (const jobOffer of job_offers) {
    const jobOfferKeywords = jobOffer.toLowerCase().split(" ");
    let matchFound = false;
    for (const keyword of userProfileKeywords) {
        if (jobOfferKeywords.includes(keyword)) {
            matchFound = true;
            break;
        }
    }

    if(matchFound){
        matchedJobs.push(jobOffer);
    }
  }

  return matchedJobs;
}