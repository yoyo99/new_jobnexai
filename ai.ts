import OpenAI from 'openai';;
// Importation de la librairie compromise pour la lemmatisation
import nlp from 'compromise';;
/**z
 * Effectue une analyse sémantique d'un texte donné.
 * Cette fonction prend en entrée un texte et retourne une liste de suggestions
 * pour améliorer le texte.
 *
 * @param {string} text - Le texte à analyser.
 * @returns {string[]} - Une liste de suggestions pour améliorer le texte.
 **/

export function semanticAnalysis(text: string): string[] {
  // Dans cette première version, nous retournons des suggestions en dur..
  return ["Améliorer la structure de la phrase.", "Ajouter des mots clés pertinents pour le poste.", "Mettre en avant vos expériences les plus significatives."];;
}

/**
 * Fonction pour analyser la description d'un poste et extraire des informations pertinentes.
 *
 * @param {string} jobDescription - La description du poste.
 * @returns {{ type: string; level: string; skills: string[]; technologies: string[]; }} - Un objet avec le type, le niveau, les compétences et les technologies.
 */

/**
 * Fonction pour analyser la description d'un poste et extraire des informations pertinentes.
 *
 * @param {string} jobDescription - La description du poste.
 * @returns {{ type: string; level: string; skills: string[]; technologies: string[]; }} - Un objet avec le type, le niveau, les compétences et les technologies.
 */
 //Fonction pour analyser la description d'un poste
interface JobDescriptionAnalysis {
  type: string;
  level: string;
  skills: string[];
  technologies: string[];
};;

function analyzeJobDescription(jobDescription: string): JobDescriptionAnalysis {
  // Normalisation du texte
  const lowerCaseDescription = jobDescription.toLowerCase();
    // Suppression de la ponctuation et des caractères spéciaux
  const cleanedDescription = lowerCaseDescription.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  // Tokenisation
  const words = cleanedDescription.split(/\s+/);
  // On utilise la librairie compromise pour la lemmatisation
    const lemmatizedWords = words.map((word) => {
        return nlp(word).nouns().toSingular().out("text") || nlp(word).verbs().toInfinitive().out("text") || word;
    });

    // Détection du type de poste (management ou technique)
    let type = "technical";
    const doc = nlp(cleanedDescription)
    //On utilise la librairie compromise pour détecter les types
    const managementTerms = ["manager", "lead", "équipe", "managing", "directeur", "direction"];
    //On itère sur les mots de la description du poste pour trouver des mots de management
    for (const term of managementTerms) {
        if (doc.match(term).found) {
            type = "management";
            break;
        }
    }
    if(doc.match("directeur").found || doc.match("direction").found){
      type = "management";
    }
    // Détection du niveau d'expérience (junior ou senior)
    let level:string = "junior";
    //On utilise la librairie compromise pour détecter les niveaux
    const seniorTerms = ["senior", "expert", "confirmé", "expérimenté", "expérimentée"];
    //On itère sur les mots de la description du poste pour trouver des mots de senior
    for (const term of seniorTerms) {
        if (doc.match(term).found) {
            level = "senior";
            break;
        }
    }
    if (doc.match("expert").found || doc.match("confirmé").found || doc.match("expérimenté").found || doc.match("expérimentée").found ){
      level = "senior";;
    }

  // Extraction des compétences (mots-clés) avec plus de précisions
  //On rajoute des mots clés de compétences
  const skillsKeywords = ["communication", "gestion de projet", "analyse", "leadership"];
  const skills: string[] = [];
  for (const keyword of skillsKeywords) {
    //On vérifie si le mot clé est présent dans la description
    if (lemmatizedWords.includes(keyword)) {
      skills.push(keyword);
    }
  }
  // Extraction des technologies (mots-clés)
  const technologiesKeywords = ["javascript", "react", "python", "java", "sql"];
  const technologies: string[] = [];
    //On rajoute des mots clés de technologies
  for (const keyword of technologiesKeywords) {
    if (lemmatizedWords.includes(keyword)) {
      technologies.push(keyword);
    }
  }
  return { type, level, skills, technologies };;
}

/**
 * Fonction pour générer une question d'entretien en fonction de la description du poste.
 *
 * @param {string} jobDescription - La description du poste.
 * @returns {string} - Une question d'entretien.
 */
export function generateInterviewQuestion(jobDescription: string): string {
  // Analyse de la description du poste
  const jobInfo = analyzeJobDescription(jobDescription);

  // Liste de questions types avec leurs mots-clés associés, leur type et leur niveau
  const questions = [
    {
      question: "Pouvez-vous me parler de votre expérience dans ce domaine ?",

      keywords: ["expérience", "parcours", "domaine"],
      type: "general",
      level: "all",
      difficulty: "easy",
    },

    {
      question: "Quelles sont vos principales compétences pour ce poste ?",
      keywords: ["compétences", "aptitudes", "qualifications"],
      type: "general", 
      level: "all", 
      difficulty: "easy"
    },
    {
      question: "Pourquoi avez-vous postulé à ce poste ?",
      keywords: ["motivation", "intérêt", "raison"],
      type: "motivation",
      level: "all",
      difficulty: "easy"
    },
    {
      question: "Comment gérez-vous le stress et la pression ?",
      keywords: ["stress", "pression", "gestion", "adaptation"],
      type: "behavioral",
      level: "all",
      difficulty: "medium"
    },
    {
      question: "Où vous voyez-vous dans cinq ans ?",
      keywords: ["projection", "avenir", "ambition", "objectif"],
      type: "motivation",
      level: "all",
      difficulty: "medium"
    },
    {      
      question:"Parlez-moi d'un défi que vous avez rencontré et comment vous l'avez surmonté.",
      keywords: ["défi", "problème", "solution", "résolution"],
      type: "behavioral",
      level: "all",
      difficulty: "hard"
    },
    {
      question:"Quelles sont vos attentes salariales ?",
      keywords: ["salaire", "rémunération", "compensation"],
      type: "general",
      level: "all",
      difficulty: "easy"
    },
    {
      question:"Avez-vous des questions ?",
      keywords: ["question", "curiosité", "éclaircissement"],
      type: "general",
      level: "all",
      difficulty: "easy"
      
    },
    {
      question: "Décrivez votre expérience avec JavaScript.",
      keywords: ["javascript"],
      type: "technical",
      level: "all",
      difficulty: "medium"
    },    
     {
      question: "Décrivez votre expérience avec React.",
      keywords: ["react"],
      type: "technical",
      level: "all",
      difficulty: "medium"
    },    
   {
      question: "Décrivez votre expérience avec Python.",
      keywords: ["python"],
      type: "technical",
      level: "all",      difficulty: "medium",
    },    
   
     {
       question:"Décrivez votre expérience avec SQL.",
       keywords: ["sql"],
      type: "technical",
      level: "all",
       difficulty: "medium"
    },
    
    {
      question: "Décrivez votre expérience avec Java.",
      keywords: ["java"],
      type: "technical",
      level: "all",
    },
    {
      question: "Comment avez-vous communiqué avec une équipe dans un projet ?",
      keywords: ["communication"],
      type: "behavioral",
      level: "all",
      difficulty: "hard",
    },    
    {
      question: "Comment avez vous gérez un projet ?",
      keywords: ["gestion de projet"],      
      type: "behavioral",
      level: "all",      difficulty: "hard",
    },
    {
      question: "Parlez-moi de vos qualités analytiques.", 
      keywords: ["analyse"],
      type: "behavioral",
      level: "all",
      difficulty: "hard",
    },

  ];;

  let bestQuestion: { question: string; keywords: string[]; type: string; level: string; difficulty: string; } = questions[0];
  let maxMatchingKeywords = 0;
  for (const question of questions) {
    // on check le type
    if(jobInfo.type === "management" && question.type !== "behavioral") continue;
    if(jobInfo.type === "technical" && question.type !== "technical" && question.type !== "general") continue;
        // On check le level
        if(jobInfo.level === "junior" && question.level === "senior") continue;
        if(jobInfo.level === "senior" && question.level === "junior") continue;
        let skillFound = false
    for (const skill of jobInfo.skills) {        
        if (question.keywords.includes(skill)) {
            skillFound = true
        }
    }
    if (jobInfo.skills.length > 0 && !skillFound) continue
        // Sélection par technologie
        let technologyFound = false
        for (const technology of jobInfo.technologies) {
            if (question.keywords.includes(technology)) {
                technologyFound = true
            }
        }
        if (jobInfo.technologies.length > 0 && !technologyFound) continue
        // Détection des mots clés dans la description.
        const jobDescriptionKeywords = lemmatizedWords;
        let matchingKeywords = 0
        //on check les mots clés
        for (const keyword of question.keywords) {
            if (jobDescriptionKeywords.includes(keyword)) {
                matchingKeywords++;
            }
        }
        if (matchingKeywords > maxMatchingKeywords) {
            maxMatchingKeywords = matchingKeywords;
            bestQuestion = question;
        }
    };

    return bestQuestion.question;;
}

/**
 * Fonction pour analyser une réponse à une question d'entretien.
 *
 * @param {string} answer - La réponse à analyser. 
 * @param {string} question - La question à laquelle la réponse répond. 
 * @returns {{ feedbacks: string[]; note: number, weakPoints: string[] }} - Une liste de feedbacks et une note, et une liste de points faibles.
 */
export function analyzeAnswer(answer: string, question: string): { feedbacks: string[]; note: number, weakPoints: string[] } {
  // Normalisation du texte
  const lowerCaseAnswer = answer.toLowerCase();
  // Suppression de la ponctuation et des caractères spéciaux
  const cleanedAnswer = lowerCaseAnswer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // On supprime les caractères spéciaux.
  // Tokenisation
      const words = cleanedAnswer.split(/\s+/);
  // On utilise la lemmatisation de compromise
  const lemmatizedAnswerWords = words.map((word) => {
    return nlp(word).nouns().toSingular().out("text") || nlp(word).verbs().toInfinitive().out("text") || word;

    });

  // Normalisation de la question

  const lowerCaseQuestion = question.toLowerCase();
  // Suppression de la ponctuation et des caractères spéciaux
  const cleanedQuestion = lowerCaseQuestion.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  // Tokenisation
  const questionWords = cleanedQuestion.split(/\s+/);

  // On utilise la librairie compromise pour la lemmatisation
   const lemmatizedQuestionWords = questionWords.map((word) => {
     return nlp(word).nouns().toSingular().out("text") || nlp(word).verbs().toInfinitive().out("text") || word;
   })
   

    // Extraction des mots-clés (pour une version plus avancée, on pourra utiliser NER ou d'autres techniques de NLP)
    const answerKeywords = lemmatizedAnswerWords.filter((word) => word.length > 2); // On ne garde que les mots de plus de 2 caractères.
    const questionKeywords = lemmatizedQuestionWords.filter((word) => word.length > 2);
    // Liste de points faibles
    const weakPoints : string[] = [];
   
        // Pertinence
    let nbOfKeywords = 0
    for (const keyword of questionKeywords) {
            if (answerKeywords.includes(keyword)) {
                nbOfKeywords++
        }
    }
    let questionKeywordsFound = nbOfKeywords;


     // Qualité de l'expression
    // Longueur de la réponse (un minimum est requis)
    if (answerKeywords.length < 5) {
        weakPoints.push("longueur")
    }

    // Liste de feedbacks possibles   
    const feedbacks = [
      "Votre réponse est un bon début, mais elle manque de details.", //0
      "Votre réponse est pertinente, vous avez bien répondu à la question.", //1
      "Votre réponse est claire et concise.", //2
      "Il serait intéressant d'ajouter plus de contexte à votre réponse.", //3
      "Vous pourriez reformuler certaines parties pour améliorer la clarté.", //4
      "Essayez de structurer votre réponse en suivant la méthode STAR (Situation, Tâche, Action, Résultat).", //5
      "Pensez à mettre en avant les compétences les plus pertinentes pour le poste.", //6
      "Vous pouvez vous améliorer sur la pertinence de votre réponse.", //7
      "Vous pouvez vous améliorer sur votre ton et votre confiance.", //8
      "Votre réponse est très pertinente.", //9
      "Votre réponse ne répond pas à la question, essayez de la reformuler.", //9
      "Vous pourriez ajouter des exemples concrets pour illustrer vos propos.",//10
      "Vous n'avez pas cité de compétence, vous pouvez en citer pour améliorer votre réponse.",//11
      "Votre réponse est trop courte, vous pouvez l'améliorer en ajoutant des details.",//12

    ];
  // Choix des feedbacks en fonction des mots-clés 
  const selectedFeedbacks: string[] = [];
  let note = 3; // Note par defaut
  if (answerKeywords.includes("exemple") || answerKeywords.includes("exemples")) {
    selectedFeedbacks.push(feedbacks[10]);
  } else {
    weakPoints.push("exemple")
  }

    if (nbOfKeywords === 0) {
        selectedFeedbacks.push(feedbacks[9]);
        note = 1; // Très mauvaise réponse
    }
    if (questionKeywordsFound === 0 && answerKeywords.length < 3) {
        selectedFeedbacks.push(feedbacks[12]);
        note = 1; // Très mauvaise réponse
    }
    if (answerKeywords.length < 3 && nbOfKeywords > 0) {
        selectedFeedbacks.push(feedbacks[0]);
        note = 2;// Mauvaise réponse
    }
    if (nbOfKeywords > 0 && answerKeywords.length > 3) {
        selectedFeedbacks.push(feedbacks[1]);
        note = 4;// Bonne réponse
    }
    if (answerKeywords.length < 3) {
        selectedFeedbacks.push(feedbacks[11]);
    }
        let competences = ["communication", "gestion", "projet", "analys", "leadership"];
    for (const competence of competences) {

        if (!answerKeywords.includes(competence)) weakPoints.push(competence);
    }

    if (selectedFeedbacks.length == 0) {     
        selectedFeedbacks.push(feedbacks[1]);
        note = 5;// Très bonne réponse
    }
    // On retourne les feedbacks, la note et les points faibles.
  return { feedbacks: selectedFeedbacks, note , weakPoints};
}

import CryptoJS from 'crypto-js';
// ... logique d'appel à l'API IA
// Déchiffrement de la clé de l'utilisateur si elle existe
let apiKey = process.env.DEFAULT_AI_API_KEY;
if (user?.aiApiKey) {
  try {
    const bytes = CryptoJS.AES.decrypt(user.aiApiKey, process.env.REACT_APP_API_KEY_SECRET || 'default_secret');
    apiKey = bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.warn('Erreur de déchiffrement de la clé IA utilisateur');
  }
}


// Initialise le client OpenAI avec la variable d'environnement correctement préfixée
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Note: In production, always use an Edge Function 
});


/**
 * Fonction pour donner une note à une réponse.
 *
 * @param {string} answer - La réponse à noter.
 * @param {string} question - La question à laquelle la réponse se rapporte.
 * @param {string} jobDescription - La description du poste.
 * @returns {number} - La note donnée à la réponse.
 */
export function rateAnswer(answer: string, question: string, jobDescription: string): number {
     // Analyse de la description du poste
    const jobInfo = analyzeJobDescription(jobDescription);
    const lowerCaseAnswer = answer.toLowerCase();
    const lowerCaseQuestion = question.toLowerCase();    // Suppression de la ponctuation et des caractères spéciaux
    const cleanedAnswer = lowerCaseAnswer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        const words = cleanedAnswer.split(/\s+/);
  // On utilise la lemmatisation de compromise
    const lemmatizedAnswerWords = words.map((word) => {
        return nlp(word).nouns().toSingular().out("text") || nlp(word).verbs().toInfinitive().out("text") || word;
    })
     const cleanedQuestion = lowerCaseQuestion.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
     // Tokenisation
     const lemmatizedQuestionWords = questionWords.map((word) => {
       return nlp(word).nouns().toSingular().out("text") || nlp(word).verbs().toInfinitive().out("text") || word;       
     });

     const questionWords = cleanedQuestion.split(/\s+/);
     // On utilise la librairie compromise pour la lemmatisation  
     const docQuestion = nlp(cleanedQuestion);
     const lemmatizedQuestionWords = docQuestion.terms().data().map((t) => {
       return t.normal; // Normalisation du mot.
   });

  // Extraction des mots-clés
  const answerKeywords = lemmatizedAnswerWords.filter((word) => word.length > 2);
  const questionKeywords = lemmatizedQuestionWords.filter((word) => word.length > 2);

  // Calcul de la note
  let note = 0;

  // Pertinence
  let nbOfKeywords = 0;
  for (const keyword of questionKeywords) {
    if (answerKeywords.includes(keyword)) {
      nbOfKeywords++;
    };
  }
  //On pondère les mots clés en fonction de leur importance et si ils sont présents dans la description du poste.
  let importantKeywords = ["expérience", "compétences", "motivation", "gestion", "communication", "analyse", "leadership"];
  let importantNbOfKeywords = 0
  for (const keyword of questionKeywords) {
          if (answerKeywords.includes(keyword) && importantKeywords.includes(keyword)) {
             importantNbOfKeywords++;
      }
  };
  if (importantNbOfKeywords == 0 && nbOfKeywords == 0) {
    note += 0;
  } else if (importantNbOfKeywords < questionKeywords.length / 2 || nbOfKeywords < questionKeywords.length/2) {
    note += 1;
  } else if (importantNbOfKeywords < questionKeywords.length || nbOfKeywords < questionKeywords.length) {
      note += 2;
  } else {
    note += 3;
  }

  // Qualité de l'expression
  if (answerKeywords.length < 5) {
    note += 0;
  } else if (answerKeywords.length < 10) {
    note += 1;
  } else {
    note += 2;
  }

  //Confiance
  if (
    answerKeywords.includes("non") ||
    answerKeywords.includes("peut-être") ||
    answerKeywords.includes("je ne sais pas")
  ) {
    note -= 1;
  } else {
    note += 1;
  }

  // Présence de compétences
    //On va regarder les compétences presentes dans le poste
    let competencesFound = false;
    if(jobInfo.skills.length > 0){        
        //On regarde si les compétences presentes dans le poste sont présentes dans la réponse
        for (const skill of jobInfo.skills) {
            if(answerKeywords.includes(skill)){
                competencesFound = true;
            }
        }
    } else {
        let competences = ["communication", "gestion", "projet", "analys", "leadership"];
        for (const competence of competences) {
            if (answerKeywords.includes(competence)) {
                competencesFound = true;
            }
        };
  }

  if (competencesFound) {    
    note += 1;
  }
    if (answerKeywords.includes("exemple") || answerKeywords.includes("exemples")) {
    note += 1
    }
     // On limite la note entre 0 et 5
  // On limite la note entre 0 et 5
  if (note > 5) {
    note = 5;
  }
  if (note < 0) {
    note = 0;
  }
  
  return note;
}

/**
 * Structure pour stocker les conversations en cours.
 */
const conversations: Conversation[] = [];

/**
 * Démarre une nouvelle conversation.
 *
 * @param {string} jobDescription - La description du poste.
 * @returns {string} - L'identifiant de la conversation.
 */
export function startConversation(jobDescription: string): string {
    const conversationId = Math.random().toString(36).substring(2, 9); // Génération d'un ID aléatoire
    const newConversation: Conversation = {
    conversationId,
    jobDescription,
    history: [], 
    weakPoints: []
    };
    conversations.push(newConversation);;
    return conversationId;
}

/**
 * Récupère la prochaine question à poser dans une conversation.
 *
 * @param {string} conversationId - L'identifiant de la conversation.
 * @returns {string} - La prochaine question.
 */
export function getNextQuestion(conversationId: string): string {
  // Recherche de la conversation par son ID
  const conversation = conversations.find((c) => c.conversationId === conversationId);
  if (!conversation) {
    throw new Error(`Conversation with ID ${conversationId} not found.`);
  }
    const weakPoints = conversation.weakPoints
    const history = conversation.history;
    const jobDescription = conversation.jobDescription;;
    const allQuestions = [
        //Liste des questions avec leur mots clés, type, niveau et difficulté.
        {
            question: "Pouvez-vous me parler de votre expérience dans ce domaine ?", 
            keywords: ["expérience", "parcours", "domaine"],
            type: "general",
            level: "all",
            difficulty: "easy",
        },
        {
            question: "Quelles sont vos principales compétences pour ce poste ?",
            keywords: ["compétences", "aptitudes", "qualifications"],            
            type: "general",
            level: "all", 
            difficulty: "easy"
        },
          
          {
            question: "Pourquoi avez-vous postulé à ce poste ?",            
            keywords: ["motivation", "intérêt", "raison"],
            type: "motivation",
            level: "all",
            difficulty: "easy",            
          },
         {
            question: "Comment gérez-vous le stress et la pression ?",
            difficulty: "medium",
            keywords: ["stress", "pression", "gestion", "adaptation"],
            type: "behavioral",
            level: "all",
          },
          {
             question: "Où vous voyez-vous dans cinq ans ?",
            keywords: ["projection", "avenir", "ambition", "objectif"],
            type: "motivation",            
            level: "all",
            difficulty: "medium",
          },          
          {
             question:
               "Parlez-moi d'un défi que vous avez rencontré et comment vous l'avez surmonté.",
            keywords: ["défi", "problème", "solution", "résolution"],
            difficulty: "hard",
            type: "behavioral",
            level: "all",
          },
          {           
            question: "Quelles sont vos attentes salariales ?",
            keywords: ["salaire", "rémunération", "compensation"],
            type: "general",
            level: "all",
          },
          {
            question: "Avez-vous des questions ?",
            keywords: ["question", "curiosité", "éclaircissement"],
            type: "general",
            level: "all",
          },
          {
            question: "Décrivez votre expérience avec JavaScript.",
            keywords: ["javascript"],
            type: "technical",            
            level: "all",
           difficulty: "medium",
          },
           {
            question: "Décrivez votre expérience avec React.",
            keywords: ["react"],
            type: "technical",            
            level: "all",
           difficulty: "medium",
          },
          {
            question: "Décrivez votre expérience avec Python.",
            keywords: ["python"],
            type: "technical",
            level: "all",
           difficulty: "medium",
          },
         {
            question: "Décrivez votre expérience avec SQL.",
            keywords: ["sql"],
            type: "technical",
            level: "all",            
            difficulty: "medium",
          },          
          {
             question: "Décrivez votre expérience avec Java.",
             keywords: ["java"],
            type: "technical",            
            level: "all",
           difficulty: "medium",
          },{            question:"Comment avez vous communiqué avec une équipe dans un projet ?",
            keywords: ["communication"],
            type: "behavioral",
            level: "all",
            difficulty: "hard"
         },
          {
            question:
              "Comment avez-vous gérez un projet ?",
            keywords: ["gestion de projet"],
            difficulty: "hard",
            type: "behavioral",            
            level: "all"
          },
          {
            question: "Parlez-moi de vos qualités analytiques.",
            difficulty: "hard",
            keywords: ["analyse"],
            type: "behavioral",
            level: "all",
          },          {           
            question:"Parlez-moi de votre expérience en leadership.",
           keywords: ["leadership"],
           type: "behavioral",
           level: "senior",
          },          {           
            question: "Quelles sont vos principales forces et faiblesses ?",
            difficulty: "hard",
            keywords: ["forces", "faiblesses"],
           type: "general",
           difficulty: "hard",
            level: "junior",
          },
          {
            question: "Pouvez vous me donner un exemple ?",
            keywords: ["exemple"],
            type: "general",
            level: "all",
          },        
           {
           question:"Comment vous améliorerez-vous en communication ?",
           keywords: ["communication"],
           type: "general",            
            difficulty: "hard",
            level: "all",
          }, 
          {
             question: "Comment vous améliorerez-vous en gestion de projet ?",
           difficulty: "medium",
            keywords: ["gestion", "projet"],
            type: "general",
            level: "junior",
          },
        ];;
        
    const averageNote = getAverageNote(conversationId); // On récupère la moyenne des notes.    

      // On adapte la difficulté des questions en fonction de la moyenne.
    let difficulty = "medium";
    if(averageNote >= 4) {
        difficulty = "hard";
    } else if (averageNote < 2) {
        difficulty = "easy";
    } else {      
        difficulty = "medium";
    }

    // On récupère toutes les questions déjà posées
    const askedQuestions = history.map(h => h.question);;

    // On filtre les questions pour ne garder que celles qui n'ont pas été posées
    // On filtre les questions pour ne garder que celles qui n'ont pas été posées et qui sont en rapport avec les compétences du poste.
    const availableQuestions = allQuestions.filter(q => !askedQuestions.includes(q.question));
   
    // On récupère les types de questions déjà posés
    const askedQuestionsTypes = history.map(h => {
        for (const question of allQuestions) {           if (question.question == h.question) {
                return question.type;            }
        }
       return "";
    });

    // Si toutes les questions ont été posées, on les repose
        // Si il y a des questions dispo on prend en compte les compétences
    if (availableQuestions.length === 0) {
        return generateInterviewQuestion(jobDescription);
    }
    // On filtre les questions en fonction de la difficulté.
    const availableQuestionsByDifficulty = availableQuestions.filter(q => q.difficulty === difficulty);
    // Si on a des questions de la difficulté demandée, on les utilise sinon on prend toute les questions.
    const questions = availableQuestionsByDifficulty.length > 0 ? availableQuestionsByDifficulty : availableQuestions;    
    // On va check les compétences
    const jobInfo = analyzeJobDescription(jobDescription);
    // On va maintenant essayer de ne pas poser 2 questions du même type d'affilé
    let nextQuestion = availableQuestions[0]
    // On vérifie si on a des points faibles.
    let weakPointsQuestions = availableQuestions.filter(q => {
      for(const weakPoint of weakPoints) {           if(q.keywords.includes(weakPoint)) return true;        }
      return false;    });
    if (weakPointsQuestions.length > 0){
        //on pose une question sur les points faibles
        nextQuestion = weakPointsQuestions[0];
    } else {    
          for (const question of availableQuestions) {
            if (askedQuestionsTypes[askedQuestionsTypes.length - 1] != question.type) {
            // Sélection par compétence
            
            
              let skillFound = false
              for (const skill of jobInfo.skills) {
                if (question.keywords.includes(skill)) {
                  skillFound = true;
                }
              }
              if (jobInfo.skills.length > 0 && skillFound) {
                nextQuestion = question;
                break;    
              }                
                
                break
            }

    }

    return nextQuestion.question;
};

/**
 * Ajoute une réponse à l'historique d'une conversation et génère des feedbacks.
 *
 * @param {string} conversationId - L'identifiant de la conversation.
 * @param {string} answer - La réponse de l'utilisateur.
 * @returns {string[]} - Les feedbacks générés pour la réponse.
 */
export function addAnswer(conversationId: string, answer: string): string[] {    
    const conversation = conversations.find((c) => c.conversationId === conversationId);
    if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found.`);
    }

    const lastExchange = conversation.history[conversation.history.length - 1];
    if (!lastExchange || !lastExchange.question) return [];
    const jobDescription = conversation.jobDescription;
    const { feedbacks, note, weakPoints } = analyzeAnswer(answer, lastExchange.question,);
    lastExchange.answer = answer;// On ajoute la réponse
    lastExchange.feedbacks = feedbacks;
    lastExchange.note = note;
    // On ajoute les nouveaux points faibles.   
    weakPoints.forEach(weakPoint => {
        if(!conversation.weakPoints.includes(weakPoint)) conversation.weakPoints.push(weakPoint)
    })
    return feedbacks;
}

/**
 * Récupère la moyenne des notes d'une conversation.
 *
 * @param {string} conversationId - L'identifiant de la conversation.
 * @returns {number} - La moyenne des notes.
 */
export function getAverageNote(conversationId: string): number {
    const conversation = conversations.find((c) => c.conversationId === conversationId);
    if (!conversation) {
        throw new Error("Conversation not found");
    };
    if (conversation.history.length === 0) {
        return 0; // Retourne 0 si aucune réponse n'a été donnée
    }
    const totalNotes = conversation.history.reduce((sum, exchange) => sum + (exchange.note || 0), 0);;
    return totalNotes / conversation.history.length;
}



/*
export async function optimizeCV(cv: any, jobDescription: string) {  try {
    const { data, error } = await supabase.functions.invoke('optimize-cv', {
      body: { cv, jobDescription }
    })

    if (error) throw error
    return data
  } catch (error) {
    trackError(error as Error, { feature: 'cv-optimization' })
    throw error
  }
}

*/
/*
export async function analyzeSimilarity(text1: string, text2: string) {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-similarity', {
        body: { text1, text2 }
      })
      if (error) throw error
      return data.similarity
    } catch (error) {
      trackError(error as Error, { feature: 'text-similarity' })
      throw error
  }
}
*/

/**z
 * Récupère l'historique complet d'une conversation.
 *
 * @param {string} conversationId - L'identifiant de la conversation.
 * @returns {{ question: string; answer?: string; feedbacks?: string[]; }[]} - L'historique de la conversation.
 */
export function getConversationHistory(conversationId: string): { question: string; answer?: string; feedbacks?: string[]; note?: number }[] {
    const conversation = conversations.find((c) => c.conversationId === conversationId);
    if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found.`);
    }
    return conversation.history;;
}
/*
export async function extractKeywords(text: string) {
  try {
    const { data, error } = await supabase.functions.invoke('extract-keywords', {
      body: { text }
    })

    if (error) throw error
    return data.keywords
  } catch (error) {
    trackError(error as Error, { feature: 'keyword-extraction' })
    throw error
  }
}
*/
export async function generateCoverLetter(
  cv: any,
  jobDescription: string,
  language: string = 'fr',
  tone: 'professional' | 'conversational' | 'enthusiastic' = 'professional'
) {
  try {
    // Use OpenAI API directly from the browser
    // Note: In production, use an Edge Function to protect your API key
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Tu es un expert en rédaction de lettres de motivation professionnelles.
          
          TÂCHE:
          Rédige une lettre de motivation personnalisée en ${language} pour la candidature décrite ci-dessous.
          
          INSTRUCTIONS:
          1. Utilise un ton ${tone === 'professional' ? 'professionnel et formel' : tone === 'conversational' ? 'conversationnel et accessible' : 'enthousiaste et dynamique'}
          2. Structure la lettre avec une introduction, un développement et une conclusion
          3. Mets en valeur les compétences et expériences du CV qui correspondent spécifiquement à l'offre d'emploi
          4. Utilise des exemples concrets tirés du CV pour illustrer l'adéquation avec le poste
          5. Évite les formules génériques et les clichés
          6. Limite la lettre à environ 300-400 mots
          7. Inclus les formules de politesse appropriées en ${language}
          
          FORMAT: Rédige une lettre complète, prête à être envoyée, avec les formules d'usage.`
        },
        {
          role: "user",
          content: `CV: ${JSON.stringify(cv)}
          
          Description du poste: ${jobDescription}`,
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    return completion.choices[0].message.content as string
  } catch (error) {
    trackError(error as Error, { feature: 'cover-letter-generation' })
    throw error
  }
}

export async function generateBulkApplicationMessages(cv: any,
  jobDescriptions: { id: string; description: string }[],
  language: string = 'fr',
) {
  try {
    // Pour chaque offre d'emploi, générer un message de candidature personnalisé
    const messages = await Promise.all(
      jobDescriptions.map(async (job) => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `Tu es un expert en rédaction de messages de candidature concis et percutants.
              
              TÂCHE:
              Rédige un court message de candidature personnalisé en ${language} (maximum 150 mots) pour accompagner un CV.
              
              INSTRUCTIONS:
              1. Sois direct et concis
              2. Mentionne 2-3 compétences clés du CV qui correspondent au poste
              3. Inclus une phrase d'accroche personnalisée
              4. Termine par une formule de politesse appropriée
              
              FORMAT:
              Un paragraphe court et impactant, sans formules d'introduction ou signature.`,
            },
            {
              role: "user",
              content: `CV: ${JSON.stringify(cv)}
              
              Description du poste: ${job.description}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        })

        return {
          jobId: job.id, 
          message: completion.choices[0].message.content
        }
      })
    )

    return messages
  } catch (error) {
    trackError(error as Error, { feature: 'bulk-application-messages' })
    throw error
  }
};
}