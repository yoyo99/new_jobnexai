import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { VideoModal } from './VideoModal'
import { PlayCircleIcon } from '@heroicons/react/24/outline'

export function Hero() {
  const { t } = useTranslation()
  const [showVideo, setShowVideo] = useState(false)

  return (
    <div className="relative isolate pt-14">
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

      <div className="py-24 sm:py-32 lg:pb-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text"
            >
              La plateforme tout-en-un pour l'emploi
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-gray-300"
            >
              JobNexAI connecte candidats, freelances et recruteurs grâce à l'IA. Trouvez le job idéal, décrochez des missions ou recrutez les meilleurs talents en toute simplicité.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <Link to="/pricing" className="btn-primary">
                {t('hero.startTrial')}
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <PlayCircleIcon className="h-5 w-5" />
                {t('hero.watchDemo')}
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 flow-root sm:mt-24"
          >
            <div className="rounded-xl bg-white/5 p-2 ring-1 ring-inset ring-white/10 lg:rounded-2xl">
              <img
                src="/jobnexus-hero.jpg"
                alt="Professionnel utilisant JobNexAI avec des interfaces futuristes"
                className="rounded-md shadow-2xl ring-1 ring-white/10 w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <VideoModal isOpen={showVideo} onClose={() => setShowVideo(false)} />
    </div>
  )
}