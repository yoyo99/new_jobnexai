import React, { Fragment, useState, useEffect } from 'react'
import { Dialog, Menu, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  ChartPieIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  RectangleGroupIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  CreditCardIcon,
  Cog6ToothIcon, // Ajout de l'icône Paramètres
} from '@heroicons/react/24/outline'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom' // Already v6 compatible
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'
import { useAuth } from '../stores/auth'
import { LanguageSwitcher } from './LanguageSwitcher'
// import ResendQuotaBanner from './ResendQuotaBanner.jsx';
import { NotificationCenter } from './notifications/NotificationCenter';
import { Header } from './Header';

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const location = useLocation()
  const [navigation, setNavigation] = useState<any[]>([])

  useEffect(() => {
    // Définir la navigation en fonction du type d'utilisateur
    if (user?.user_type === 'freelancer') {
      setNavigation([
        { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
        { name: 'Projets disponibles', href: '/freelance/projects', icon: RectangleGroupIcon },
        { name: 'Mon profil freelance', href: '/freelance/profile', icon: UserIcon },
        { name: 'CV Builder', href: '/cv-builder', icon: DocumentTextIcon },
        { name: 'Réseau', href: '/network', icon: UsersIcon },
        { name: 'Analyse du marché', href: '/market-analysis', icon: ChartPieIcon },
        { name: 'Facturation', href: '/billing', icon: CreditCardIcon },
        { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon },
      ])
    } else if (user?.user_type === 'recruiter') {
      setNavigation([
        { name: 'Dashboard', href: '/recruiter/dashboard', icon: HomeIcon },
        { name: 'Recherche de candidats', href: '/recruiter/candidates', icon: MagnifyingGlassIcon },
        { name: 'Mes offres d\'emploi', href: '/recruiter/job-postings', icon: ClipboardDocumentListIcon },
        { name: 'Créer une offre', href: '/recruiter/create-job', icon: PlusCircleIcon },
        { name: 'Réseau', href: '/network', icon: UsersIcon },
        { name: 'Profil', href: '/profile', icon: UserIcon },
        { name: 'Facturation', href: '/billing', icon: CreditCardIcon },
        { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon },
      ])
    } else {
      // Navigation par défaut pour les candidats
      setNavigation([
        { name: 'navigation.dashboard', href: '/app/dashboard', icon: HomeIcon },
        { name: 'navigation.jobSearch', href: '/jobs', icon: FolderIcon },
        { name: 'navigation.applications', href: '/suivi', icon: ClipboardDocumentListIcon },
        { name: 'navigation.cvBuilder', href: '/cv-builder', icon: DocumentTextIcon },
        { name: 'navigation.network', href: '/network', icon: UsersIcon },
        { name: 'navigation.marketAnalysis', href: '/market-analysis', icon: ChartPieIcon },
        { name: 'navigation.profile.title', href: '/profile', icon: UserIcon },
        { name: 'Facturation', href: '/billing', icon: CreditCardIcon },
        { name: 'Paramètres', href: '/settings', icon: Cog6ToothIcon },
      ])
    }
  }, [user?.user_type, t])

  const handleSignOut = async () => {
    console.log('[DashboardLayout] Déconnexion via le store...');
    await signOut();
    // La redirection est maintenant gérée par le changement d'état et ProtectedRoute.
  };

  return (
    <div>
      {/* <ResendQuotaBanner /> */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4 ring-1 ring-white/10">
                  <div className="flex h-16 shrink-0 items-center">
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text">
                      JobNexAI
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={cn(
                                  'text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                                  location.pathname === item.href && 'bg-gray-800 text-white'
                                )}
                              >
                                <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                {typeof item.name === 'string' && item.name.startsWith('navigation.') 
                                  ? t(item.name) 
                                  : item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col" style={{ zIndex: 50 }}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4 border-r border-white/10">
          <div className="flex h-16 shrink-0 items-center">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text">
              JobNexAI
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          'text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                          location.pathname === item.href && 'bg-gray-800 text-white'
                        )}
                      >
                        <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                        {typeof item.name === 'string' && item.name.startsWith('navigation.') 
                          ? t(item.name) 
                          : item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
          <Header />

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}