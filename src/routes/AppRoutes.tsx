import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DashboardLayout } from '../components/DashboardLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingFallback } from '../components/LoadingFallback';
import { AdminDashboard } from '../components/AdminDashboard';

// Wrapper pour les composants lazy-loaded avec ErrorBoundary spécifique
const LazyComponentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary fallback={<div className="card m-8 text-center bg-background/80 backdrop-blur-lg">
      <h2 className="text-xl font-semibold text-primary-400 mb-4">Un problème est survenu lors du chargement de cette page</h2>
      <p className="text-white/80 mb-6">Nous nous excusons pour cet inconvénient. L'équipe technique a été informée du problème.</p>
      <button 
        onClick={() => window.location.reload()}
        className="btn-primary"
      >
        Essayer de recharger
      </button>
    </div>}>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Définitions des composants lazy-loadés pour les routes de l'application
const Dashboard = React.lazy(() => import('../components/Dashboard'));
const Profile = React.lazy(() => import('../components/Profile'));
const Billing = React.lazy(() => import('../components/Billing'));
const JobSearch = React.lazy(() => import('../components/JobSearch'));
const JobApplications = React.lazy(() => import('../components/JobApplications'));
const MarketAnalysis = React.lazy(() => import('../components/MarketAnalysis'));
const CVBuilder = React.lazy(() => import('../components/cv/CVBuilder'));
const Settings = React.lazy(() => import('../components/Settings').then(module => ({ default: module.Settings })));
const NetworkPage = React.lazy(() => import('../components/NetworkPage'));
const MarketTrendsPage = React.lazy(() => import('../components/pages/MarketTrendsPage'));
const FreelanceProjects = React.lazy(() => import('../components/freelance/FreelanceProjects'));
const FreelanceProfile = React.lazy(() => import('../components/freelance/FreelanceProfile'));
const RecruiterDashboard = React.lazy(() => import('../components/recruiter/RecruiterDashboard'));
const CandidateSearch = React.lazy(() => import('../components/recruiter/CandidateSearch'));
const JobPostings = React.lazy(() => import('../components/recruiter/JobPostings'));
const CreateJobPosting = React.lazy(() => import('../components/recruiter/CreateJobPosting'));
const CoverLetterGenerator = React.lazy(() => import('../components/applications/CoverLetterGenerator').then(module => ({ default: module.CoverLetterGenerator })));
const UserCoverLetters = React.lazy(() => import('../components/applications/UserCoverLetters'));
const FranceTravailPage = React.lazy(() => import('../pages/FranceTravailPage'));
const ScrapingTestPage = React.lazy(() => import('../pages/ScrapingTestPage'));
const TestVpsPage = React.lazy(() => import('../pages/TestVpsPage'));
const CVAnalysisN8N = React.lazy(() => import('../components/CVAnalysisN8N'));
const JobScrapingN8N = React.lazy(() => import('../components/JobScrapingN8N'));
const JobDetails = React.lazy(() => import('../components/JobDetails'));

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Route Admin accessible partout si admin */}
      <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
      <Route 
        path="/app" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Redirection de la racine protégée vers le dashboard */}
        <Route index element={<Navigate to="/app/dashboard" replace />} /> 

        {/* Routes générales du dashboard */}
        <Route path="dashboard" element={<LazyComponentWrapper><Dashboard /></LazyComponentWrapper>} />
        <Route path="profile" element={<LazyComponentWrapper><Profile /></LazyComponentWrapper>} />
        <Route path="billing" element={<LazyComponentWrapper><Billing /></LazyComponentWrapper>} />
        <Route path="settings" element={<LazyComponentWrapper><Settings /></LazyComponentWrapper>} />
        
        {/* Routes nécessitant un abonnement */}
        <Route path="jobs" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><JobSearch /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="jobs/:id" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><JobDetails /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="france-travail" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><FranceTravailPage /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="suivi" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><JobApplications /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="market-analysis" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><MarketAnalysis /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="cv-builder" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CVBuilder /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="network" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><NetworkPage /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="market-trends" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><MarketTrendsPage /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="cover-letter-generator" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CoverLetterGenerator /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="cover-letters" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><UserCoverLetters /></LazyComponentWrapper></ProtectedRoute>} />

        {/* Routes Freelance (avec abonnement) */}
        <Route path="freelance/projects" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><FreelanceProjects /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="freelance/profile" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><FreelanceProfile /></LazyComponentWrapper></ProtectedRoute>} />

        {/* Routes Recruteur (avec abonnement) */}
        <Route path="recruiter/dashboard" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><RecruiterDashboard /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="recruiter/candidates" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CandidateSearch /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="recruiter/job-postings" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><JobPostings /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="recruiter/create-job" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CreateJobPosting /></LazyComponentWrapper></ProtectedRoute>} />

        {/* Routes N8N Integration */}
        <Route path="cv-analysis-ai" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><CVAnalysisN8N /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="job-scraping" element={<ProtectedRoute requiresSubscription><LazyComponentWrapper><JobScrapingN8N /></LazyComponentWrapper></ProtectedRoute>} />

        {/* Route de test pour l'infrastructure N8N */}
        <Route path="scraping-test" element={<ProtectedRoute adminOnly><LazyComponentWrapper><ScrapingTestPage /></LazyComponentWrapper></ProtectedRoute>} />
        <Route path="test-vps" element={<ProtectedRoute adminOnly><LazyComponentWrapper><TestVpsPage /></LazyComponentWrapper></ProtectedRoute>} />

        {/* L'ancienne route /user-type est maintenant gérée par la logique de redirection interne */}
        <Route path="user-type" element={<Navigate to="/app/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
