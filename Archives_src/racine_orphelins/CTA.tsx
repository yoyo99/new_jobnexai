import { Link } from 'react-router-dom'

export function CTA() {
  return (
    <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 bg-gradient-to-tr from-primary-600 to-secondary-600 opacity-10 sm:left-[calc(50%-40rem)]"></div>
      </div>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Prêt à booster votre carrière ?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
          Rejoignez des milliers de professionnels qui ont déjà transformé leur recherche d'emploi avec JobNexAI.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/pricing"
            className="btn-primary"
          >
            Commencer gratuitement
          </Link>
          <Link to="/login" className="text-sm font-semibold leading-6 text-white">
            Se connecter <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
