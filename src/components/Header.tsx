import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react' // Nécessaire pour Transition
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ui/theme-toggle'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../stores/auth'
import simpleLogoSrc from '../assets/images/simple_logo.svg'; // Import SVG as a source URL

// Navigation pour les utilisateurs non connectés
const publicNavigation = [
  { name: 'Fonctionnalités', href: '/features' },
  { name: 'Comment ça marche', href: '/how-it-works' },
  { name: 'Tarifs', href: '/pricing' },
  { name: 'Témoignages', href: '/testimonials' },
]

// Navigation pour les utilisateurs connectés (avant admin)
const userCoreNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Job Search', href: '/jobs' },
  { name: 'Suivi', href: '/suivi' },
  { name: 'CV Builder', href: '/cv-builder' },
  { name: 'Network', href: '/network' },
  { name: 'Market Analysis', href: '/market-analysis' },
  { name: 'Profile', href: '/profile' },
  { name: 'Billing', href: '/billing' },
];

const adminSpecificNavigation = [
  { name: 'Admin', href: '/admin' },
];

export function Header() {
  console.log('[Header] FUNCTION EXECUTION STARTED'); // <--- NOUVEAU LOG AJOUTÉ ICI
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useTranslation()
  const { user, subscription, signOut } = useAuth()
  console.log('[Header] User from useAuth in Header:', user);
  const location = useLocation()
  const navigate = useNavigate() // Ajout pour la redirection après déconnexion

  // Déterminer la navigation à afficher
  let currentNavigation;
  if (user) {
    currentNavigation = [...userCoreNavigation];
    if (user.is_admin) {
      currentNavigation = [...currentNavigation, ...adminSpecificNavigation];
    }
  } else {
    currentNavigation = publicNavigation;
  }
  const debugSimplifiedHeader = false; // Mettez à false pour afficher le header original

  const handleSignOutClick = async () => {
    console.log('[Header] Déconnexion via le store...');
    setMobileMenuOpen(false); // Fermer le menu mobile si ouvert
    await signOut();
    // La redirection est maintenant gérée par le changement d'état et ProtectedRoute.
    // Il n'y a plus besoin de redirection manuelle ici.
  };

  if (debugSimplifiedHeader) {
    // Simplified return for debugging
    return (
      <div style={{ padding: '20px', backgroundColor: 'lightcoral', color: 'white', textAlign: 'center' }}>
        Test Header Content. Admin link should appear here if logic is correct: 
        {user && user.is_admin && <a href="/admin" style={{ color: 'yellow', marginLeft: '10px' }}>ADMIN LINK TEST</a>}
      </div>
    );
  } else {
    // Original return content (previously commented out)
    return (
      <header className="backdrop-blur-sm border-b border-white/10">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          {((): boolean => true)() && // Re-enable Logo section's parent div
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center">
              <span className="sr-only">JobNexAI</span>
              <img src={simpleLogoSrc} alt="JobNexAI Logo" className="h-10 w-auto" />
              {/* Link Text Test */}
            </Link>
          </div>
          }
          {((): boolean => true)() && // Enable mobile menu button
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
          }
          {((): boolean => true)() && // Re-enable desktop navigation links
          <div className="hidden lg:flex lg:gap-x-12">
            {currentNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-semibold leading-6 text-white hover:text-primary-400 transition-colors"
              >
                {t(item.name)}
              </Link>
            ))}
          </div>
          }
          {((): boolean => true)() && // Restore user section display
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center">
            <div className="mr-4">
              <LanguageSwitcher />
            </div>
            <div className="mr-4">
              <ThemeToggle />
            </div>
            {user ? (
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                    <span className="sr-only">Open user menu</span>
                    {/* Idéalement, ici une image de profil user.avatar_url, sinon une icône ou les initiales */}
                    <span className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm font-medium text-white hidden md:block">
                      {user.full_name || user.email}
                    </span>
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-background ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3">
                      <p className="text-sm text-white">Connecté en tant que</p>
                      <p className="text-sm font-medium text-primary-300 truncate">
                        {user.email}
                      </p>
                      {subscription && (
                        <p className="text-xs text-gray-400 truncate mt-1">
                          Plan: {t(`plans.${subscription.plan}`, subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1))}
                        </p>
                      )}
                    </div>
                    {user.is_admin && (
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/admin"
                            className={`${active ? 'bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300 w-full`}
                          >
                            {/* Vous pouvez ajouter une icône spécifique pour Admin si vous le souhaitez */}
                            Admin Panel
                          </Link>
                        )}
                      </Menu.Item>
                    )}
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${active ? 'bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white w-full`}
                        >
                          <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
                          Profil
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/settings"
                          className={`${active ? 'bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white w-full`}
                        >
                          <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
                          Paramètres
                        </Link>
                      )}
                    </Menu.Item>
                    <div className="border-t border-gray-700 my-1"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSignOutClick}
                          className={`${active ? 'bg-gray-700' : ''} group flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 w-full`}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-400" aria-hidden="true" />
                          Déconnexion
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex items-center space-x-4">
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
              </div>
            )}
          </div>
          }
        </nav>
        {((): boolean => true)() && // Re-enable Mobile Menu Dialog
        <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5">
                <span className="sr-only">JobNexAI</span>
                <img src={simpleLogoSrc} alt="JobNexAI Logo" className="h-10 w-auto" />
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
                  {currentNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t(item.name)}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  <div className="mb-4">
                    <LanguageSwitcher />
                  </div>
                  <div className="mb-4">
                    <ThemeToggle />
                  </div>
                  {user ? (
                    <div className="py-6">
                      {user.is_admin && (
                        <Link
                          to="/admin"
                          className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-yellow-400 hover:bg-white/10"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Admin
                        </Link>
                      )}
                      <span className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white">
                        {user.full_name || user.email}
                      </span>
                      {subscription && (
                        <span className="-mx-3 block rounded-lg px-3 py-1 text-sm bg-primary-500 text-white w-fit">
                          {t(`plans.${subscription.plan}`, subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1))}
                        </span>
                      )}
                      <button
                        onClick={handleSignOutClick}
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-400 hover:bg-white/10 w-full text-left mt-2"
                      >
                        {t('auth.logout', 'Déconnexion')}
                      </button>
                      {/* Optionnel: Lien vers la page de profil/facturation pour mobile */}
                      {/* <Link to="/profile" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>Profil</Link> */}
                    </div>
                  ) : (
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
        }
      </header>
    );
  }
}