import { motion } from 'framer-motion'

const steps = [
  {
    title: "Créez votre profil",
    description: "Importez votre CV ou créez-en un nouveau avec notre outil intuitif. Notre IA analysera vos compétences et votre expérience.",
    icon: "1",
  },
  {
    title: "Recevez des suggestions personnalisées",
    description: "Notre algorithme vous propose des offres d'emploi correspondant à votre profil, avec un score de compatibilité pour chaque poste.",
    icon: "2",
  },
  {
    title: "Postulez et suivez vos candidatures",
    description: "Postulez directement depuis la plateforme et suivez l'avancement de toutes vos candidatures dans un tableau de bord centralisé.",
    icon: "3",
  },
]

export function HowItWorks() {
  return (
    <div className="bg-white/5 py-24 sm:py-32" id="how-it-works">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-400">Comment ça marche</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trouvez votre emploi idéal en 3 étapes simples
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Notre plateforme simplifie votre recherche d'emploi grâce à l'intelligence artificielle et des outils intuitifs.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className="relative"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white text-xl font-bold">
                  {step.icon}
                </div>
                <h3 className="mt-6 text-lg font-semibold leading-8 text-white">{step.title}</h3>
                <p className="mt-2 text-base leading-7 text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}