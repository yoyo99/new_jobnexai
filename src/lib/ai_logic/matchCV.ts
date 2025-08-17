// matchCV.ts - Utilise le client Mammouth.ai pour le matching CV-Offre
import { askMammouthFromCV } from '../../api/askMammouthFromCV';

/**
 * Compare un CV avec une description de poste et retourne un score de correspondance
 * ainsi qu'un résumé des points clés en utilisant Mammouth.ai.
 * 
 * @param cvText - Le texte brut du CV du candidat
 * @param jobDescription - La description du poste à pourvoir
 * @returns Un objet contenant un score (0-100) et un résumé de la correspondance
 */
export async function matchCVWithJob(cvText: string, jobDescription: string): Promise<{ score: number; summary: string }> {
    try {
        // Appel à la fonction centralisée qui utilise Mammouth.ai
        const responseText = await askMammouthFromCV(cvText, jobDescription);

        // Tentative d'analyse de la réponse JSON
        try {
            const parsedResponse = JSON.parse(responseText);
            
            // Validation de la structure de la réponse
            if (typeof parsedResponse.score !== 'number' || typeof parsedResponse.summary !== 'string') {
                throw new Error('Format de réponse invalide de la part de l`API');
            }

            // Assure que le score est entre 0 et 100
            const score = Math.max(0, Math.min(100, Math.round(parsedResponse.score)));
            
            return {
                score,
                summary: parsedResponse.summary.trim()
            };
        } catch (parseError) {
            console.error('Erreur lors de l`analyse de la réponse de l`API:', parseError);
            // Si la réponse n'est pas un JSON, on la retourne comme résumé avec un score de 0
            return {
                score: 0,
                summary: responseText
            };
        }
    } catch (error) {
        console.error('Erreur dans matchCVWithJob:', error);
        // En cas d'erreur, retourner un score neutre avec un message d'erreur
        return {
            score: 0,
            summary: `Désolé, une erreur est survenue lors de l'analyse du CV. Veuillez réessayer. (${error instanceof Error ? error.message : 'Unknown error'})`
        };
    }
}
