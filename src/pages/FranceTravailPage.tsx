import { FranceTravailJobList } from '../components/FranceTravailJobList'

export default function FranceTravailPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🇫🇷 France Travail
        </h1>
        <p className="text-gray-600 text-lg">
          Explorez les offres d'emploi officielles de France Travail (ex-Pôle Emploi)
        </p>
      </div>
      
      <FranceTravailJobList />
    </div>
  )
}
