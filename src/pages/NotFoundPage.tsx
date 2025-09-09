import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-300 mb-8">Désolé, la page que vous cherchez n'existe pas.</p>
        <Link 
          to="/"
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors duration-300"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
