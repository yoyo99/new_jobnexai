import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { N8NService, CVAnalysisResult } from '@/services/n8n-service';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CVAnalysisN8N() {
  const { user } = useAuth();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CVAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Seuls les fichiers PDF sont acceptés');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 5 MB');
        return;
      }
      setCvFile(file);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!cvFile || !jobUrl || !user?.email) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await N8NService.analyzeCVWithJob({
        cvFile,
        jobUrl,
        userEmail: user.email
      });

      setResult(analysisResult);
      toast.success('Analyse terminée avec succès !');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Analyse CV avec IA
            </h1>
            <p className="text-gray-600">
              Powered by N8N + Mammouth.ai
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <div className="space-y-4">
          {/* CV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre CV (PDF)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">
                  {cvFile ? cvFile.name : 'Choisir un fichier PDF'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {cvFile && (
                <button
                  onClick={() => setCvFile(null)}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Job URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de l'offre d'emploi
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://www.linkedin.com/jobs/view/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!cvFile || !jobUrl || isAnalyzing}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Analyser le CV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Erreur</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Matching Score */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Score de Correspondance
              </h2>
              <div className={`px-4 py-2 rounded-lg ${getScoreBgColor(result.matching_score)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(result.matching_score)}`}>
                  {result.matching_score}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  result.matching_score >= 80 ? 'bg-green-600' :
                  result.matching_score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${result.matching_score}%` }}
              />
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Recommandation</h3>
                <p className="text-gray-700">{result.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900">Points Forts</h3>
              </div>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-gray-900">Points à Améliorer</h3>
              </div>
              <ul className="space-y-2">
                {result.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Skills Match */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Compétences</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Matched Skills */}
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-3">
                  Compétences Correspondantes ({result.skills_match.matched.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.skills_match.matched.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-3">
                  Compétences Manquantes ({result.skills_match.missing.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.skills_match.missing.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Experience Match */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-3">Expérience</h3>
            <p className="text-gray-700">{result.experience_match}</p>
          </div>

          {/* Key Insights */}
          {result.key_insights && result.key_insights.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Insights Clés</h3>
              <ul className="space-y-2">
                {result.key_insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-1">💡</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interview Questions */}
          {result.interview_questions && result.interview_questions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Questions d'Entretien Suggérées
              </h3>
              <ul className="space-y-3">
                {result.interview_questions.map((question, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="font-bold text-blue-600 flex-shrink-0">
                      Q{index + 1}.
                    </span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
