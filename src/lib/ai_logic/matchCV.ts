// matchCV.ts - Intégration Mistral AI pour le matching CV-Offre
import { Mistral } from '@mistralai/mistralai';

// Récupération de la clé API Mistral depuis les variables d'environnement
const mistralApiKey = process.env.MISTRAL_API_KEY;

if (!mistralApiKey) {
  throw new Error('MISTRAL_API_KEY is not set in environment variables. Please configure it for the function to work.');
}

// Initialisation du client Mistral
const client = new Mistral({ apiKey: mistralApiKey });

/**
 * Compare un CV avec une description de poste et retourne un score de correspondance
 * ainsi qu'un résumé des points clés.
 * 
 * @param cvText - Le texte brut du CV du candidat
 * @param jobDescription - La description du poste à pourvoir
 * @returns Un objet contenant un score (0-100) et un résumé de la correspondance
 */
export async function matchCVWithJob(cvText: string, jobDescription: string): Promise<{ score: number; summary: string }> {
    try {
        // Création du prompt pour l'IA
        const systemPrompt = `Tu es un assistant expert en recrutement. Ton rôle est d'analyser la correspondance entre un CV et une offre d'emploi.
        Tu dois évaluer sur 100 la pertinence du CV par rapport au poste et fournir un résumé concis (3-5 phrases) expliquant les points forts et les éventuelles lacunes.
        Ta réponse DOIT être un objet JSON valide avec les clés 'score' (nombre entier) et 'summary' (chaîne de caractères).
        Ne mets aucun texte avant ou après l'objet JSON.`;
        
        const userPrompt = `CV du candidat:\n${cvText}\n\nOffre d'emploi:\n${jobDescription}\n\nÉvalue la correspondance et renvoie uniquement un objet JSON.`;

        // Appel à l'API Mistral
        const chatResponse = await client.chat.complete({
            model: 'mistral-small-latest',  // Modèle recommandé pour le free tier
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,  // Pour des réponses plus déterministes
            responseFormat: { type: 'json_object' }  // Pour forcer un format JSON en sortie
        });

        // Récupération et validation de la réponse
        const responseContent = chatResponse.choices[0]?.message?.content;
        if (!responseContent || Array.isArray(responseContent)) {
            throw new Error('No valid content in Mistral AI response');
        }

        // Tentative d'analyse de la réponse JSON
        try {
            const parsedResponse = JSON.parse(responseContent);
            
            // Validation de la structure de la réponse
            if (typeof parsedResponse.score !== 'number' || typeof parsedResponse.summary !== 'string') {
                throw new Error('Invalid response format from Mistral AI');
            }

            // Assure que le score est entre 0 et 100
            const score = Math.max(0, Math.min(100, Math.round(parsedResponse.score)));
            
            return {
                score,
                summary: parsedResponse.summary.trim()
            };
        } catch (parseError) {
            console.error('Error parsing Mistral AI response:', parseError);
            throw new Error('Failed to parse AI response. The response was not valid JSON.');
        }
    } catch (error) {
        console.error('Error in matchCVWithJob:', error);
        // En cas d'erreur, retourner un score neutre avec un message d'erreur
        return {
            score: 0,
            summary: `Désolé, une erreur est survenue lors de l'analyse du CV. Veuillez réessayer. (${error instanceof Error ? error.message : 'Unknown error'})`
        };
    }
    // // Add error handling for JSON parsing if the response might not be valid JSON.
    // try {
    //     if (response && response.output && typeof response.output.text === 'string') {
    //         const parsedResult = JSON.parse(response.output.text);

    //         if (typeof parsedResult.score === 'number' && typeof parsedResult.summary === 'string') {
    //             return { score: parsedResult.score, summary: parsedResult.summary };
    //         } else {
    //             console.error("Parsed Qwen response does not match expected structure:", parsedResult);
    //             throw new Error("AI response structure mismatch.");
    //         }
    //     } else {
    //         console.error("Invalid response structure from Qwen:", response);
    //         throw new Error("AI response format unexpected.");
    //     }
    // } catch (error) {
    //     console.error("Failed to parse Qwen response:", error);
    //     console.error("Raw Qwen response:", response);
    //     throw new Error("AI response was not valid JSON.");
    // }
    // --- End of original Qwen logic ---
}
