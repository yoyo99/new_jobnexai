import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, useLocation } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../stores/auth'

// Navigation pour les utilisateurs non connectés
const publicNavigation = [
  { name: 'Fonctionnalités', href: '/features' },
  { name: 'Comment ça marche', href: '/how-it-works' },
  { name: 'Tarifs', href: '/pricing' },
  { name: 'Témoignages', href: '/testimonials' },
]

// Navigation pour les utilisateurs connectés
const privateNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Job Search', href: '/jobs' },
  { name: 'Applications', href: '/applications' },
  { name: 'CV Builder', href: '/cv-builder' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()

  // Utiliser la navigation publique pour les utilisateurs non connectés
  // et la navigation privée pour les utilisateurs connectés
  const navigation = user ? privateNavigation : publicNavigation

  return (
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
          {navigation.map((item) => (
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
                {navigation.map((item) => (
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
  )
}