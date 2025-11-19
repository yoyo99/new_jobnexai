import { motion } from 'framer-motion'
import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../stores/auth'
import { Footer } from '../Footer'

// Navigation pour les utilisateurs non connectés
const publicNavigation = [
  { name: 'Fonctionnalités', href: '/features' },
  { name: 'Comment ça marche', href: '/how-it-works' },
  { name: 'Tarifs', href: '/pricing' },
  { name: 'Témoignages', href: '/testimonials' },
]

const steps = [
  {
    id: '01',
    title: 'Créez votre profil',
    description: 'Importez votre CV ou créez-en un nouveau avec notre outil intuitif. Notre IA analysera vos compétences et votre expérience pour optimiser votre profil.',
    image: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
  },
  {
    id: '02',
    title: 'Recevez des suggestions personnalisées',
    description: 'Notre algorithme vous propose des offres d\'emploi correspondant à votre profil, avec un score de compatibilité pour chaque poste. Plus vous utilisez la plateforme, plus les suggestions deviennent pertinentes.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
  },
  {
    id: '03',
    title: 'Optimisez vos candidatures',
    description: 'Notre IA analyse chaque offre d\'emploi et vous suggère des optimisations pour votre CV et lettre de motivation. Vous pouvez également utiliser notre outil de rédaction assistée pour créer des candidatures percutantes.',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
  },
  {
    id: '04',
    title: 'Postulez et suivez vos candidatures',
    description: 'Postulez directement depuis la plateforme et suivez l\'avancement de toutes vos candidatures dans un tableau de bord centralisé. Recevez des rappels automatiques pour les entretiens et les relances.',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
  },
  {
    id: '05',
    title: 'Développez votre réseau',
    description: 'Connectez-vous avec d\'autres professionnels, échangez des messages et développez votre réseau directement depuis la plateforme. Notre système de mise en relation vous suggère des contacts pertinents pour votre carrière.',
    image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80',
  },
]

const faqs = [
  {
    question: 'Comment fonctionne l\'algorithme de matching ?',
    answer: 'Notre algorithme utilise l\'intelligence artificielle pour analyser votre profil (compétences, expérience, préférences) et le comparer aux offres d\'emploi disponibles. Il prend en compte plus de 50 critères différents pour calculer un score de compatibilité précis et vous proposer les offres les plus pertinentes.',
  },
  {
    question: 'Combien de temps faut-il pour créer un profil complet ?',
    answer: 'La création d\'un profil de base prend environ 5 minutes. Pour un profil complet avec toutes vos compétences, expériences et préférences, comptez environ 15-20 minutes. Vous pouvez également importer votre CV pour accélérer le processus.',
  },
  {
    question: 'Les recruteurs peuvent-ils me contacter directement ?',
    answer: 'Oui, si vous activez cette option dans vos paramètres de confidentialité. Vous gardez le contrôle total sur qui peut vous contacter et pouvez modifier ces paramètres à tout moment.',
  },
  {
    question: 'Comment l\'IA optimise-t-elle mon CV ?',
    answer: 'Notre IA analyse votre CV et le compare aux meilleures pratiques du secteur et aux exigences spécifiques de chaque offre d\'emploi. Elle vous suggère ensuite des améliorations pour mettre en valeur vos compétences pertinentes, utiliser les bons mots-clés et optimiser la structure pour les systèmes ATS des recruteurs.',
  },
  {
    question: 'Puis-je utiliser JobNexAI sur mobile ?',
    answer: 'Absolument ! JobNexAI est entièrement responsive et fonctionne parfaitement sur tous les appareils. Nous proposons également une application mobile pour iOS et Android pour une expérience encore plus fluide.',
  },
]

export function HowItWorksPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-sm border-b border-white/10">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="sr-only">JobNexAI</span>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text">
                JobNexAI
              </div>
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {publicNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-semibold leading-6 text-white hover:text-primary-400 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-4">
            <LanguageSwitcher />
            {!user && (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-semibold px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  {t('auth.login')}
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-sm font-semibold px-3 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-500 hover:to-secondary-500 transition-colors"
                >
                  {t('auth.startTrial')}
                </Link>
              </>
            )}
          </div>
        </nav>
        <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5">
                <span className="sr-only">JobNexAI</span>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text">
                  JobNexAI
                </div>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-white/10">
                <div className="space-y-2 py-6">
                  {publicNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  <div className="mb-4">
                    <LanguageSwitcher />
                  </div>
                  {!user && (
                    <div className="space-y-4">
                      <Link
                        to="/login"
                        className="block text-center text-sm font-semibold px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                      >
                        {t('auth.login')}
                      </Link>
                      <Link
                        to="/pricing"
                        className="block text-center text-sm font-semibold px-3 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-500 hover:to-secondary-500 transition-colors"
                      >
                        {t('auth.startTrial')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>
      <main>
        {/* Hero section */}
        <div className="relative isolate pt-24">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-600 to-secondary-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>

          <div className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text"
                >
                  Comment ça marche
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-6 text-lg leading-8 text-gray-300"
                >
                  Découvrez comment JobNexAI transforme votre recherche d'emploi en un processus simple, efficace et personnalisé grâce à l'intelligence artificielle.
                </motion.p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps section */}
        <div className="bg-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-400">Processus simplifié</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Trouvez votre emploi idéal en 5 étapes
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Notre plateforme simplifie votre recherche d'emploi grâce à l'intelligence artificielle et des outils intuitifs.
              </p>
            </div>
            
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative pb-12 ${index === steps.length - 1 ? '' : 'border-l border-white/20'} pl-12`}
                >
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-secondary-600 -translate-x-1/2 text-white font-bold">
                    {step.id}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-xl">
                      <img src={step.image} alt={step.title} className="w-full h-auto" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Video demo section */}
        <div className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-400">Voir en action</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Découvrez JobNexAI en vidéo
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Une démonstration vaut mieux que mille mots. Regardez comment JobNexAI peut transformer votre recherche d'emploi.
              </p>
            </div>
            
            <div className="mx-auto mt-16 max-w-4xl">
              <div className="aspect-video rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-gray-400 mb-4">Vidéo de démonstration</p>
                  <button className="btn-primary">
                    Regarder la démo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="bg-white/5 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-400">Questions fréquentes</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Tout ce que vous devez savoir
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Vous avez des questions ? Nous avons les réponses. Voici les questions les plus fréquemment posées sur JobNexAI.
              </p>
            </div>
            
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="space-y-8">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="bg-white/10 p-8 rounded-xl"
                  >
                    <dt className="text-lg font-semibold text-white mb-4">{faq.question}</dt>
                    <dd className="text-gray-400">{faq.answer}</dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 bg-gradient-to-tr from-primary-600 to-secondary-600 opacity-10 sm:left-[calc(50%-40rem)]"></div>
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Prêt à commencer votre nouvelle aventure professionnelle ?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Rejoignez des milliers de professionnels qui ont déjà transformé leur recherche d'emploi avec JobNexAI.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/pricing"
                className="btn-primary"
              >
                Commencer gratuitement
              </a>
              <a href="/login" className="text-sm font-semibold leading-6 text-white">
                Se connecter <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}