import React from 'react';
import { Link } from 'react-router-dom'; // Assumant que vous utilisez React Router
import { FaRocket, FaSearch, FaFileSignature, FaTasks, FaShieldAlt, FaLanguage, FaLightbulb } from 'react-icons/fa';
import { motion } from 'framer-motion';
import SiteHeader from '../components/SiteHeader'; // Importer le nouveau header

// Si vous avez copié le logo dans public/assets/
const logoUrl = '/assets/Logo-JobNexAI.svg'; // Ajustez si le nom ou le chemin est différent dans le répertoire

const LandingPage: React.FC = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <SiteHeader showAuthLinks={true} />

      {/* Hero Section */}
      <main className="flex-grow overflow-y-auto">
        <section className="bg-gray-800 py-20 px-4 text-center">
          <div className="container mx-auto">
            <img src={logoUrl} alt="JobNexAI Logo" className="h-24 w-auto mx-auto mb-8" />
            <h1 className="text-5xl font-extrabold text-white sm:text-6xl md:text-7xl">
              Votre Carrière <span className="text-primary-400">Propulsée par l'IA</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              JobNexAI révolutionne votre recherche d'emploi. Trouvez les meilleures opportunités, créez des candidatures percutantes et gérez votre parcours professionnel, le tout avec l'intelligence artificielle à vos côtés.
            </p>
            <div className="mt-10">
              <Link
                to="/register"
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-xl transition duration-150 ease-in-out transform hover:scale-105"
              >
                Commencer l'aventure
              </Link>
              <a
                href="#features" // Lien vers la section des fonctionnalités
                className="ml-4 text-gray-300 hover:text-primary-400 font-semibold py-3 px-8 rounded-lg text-lg transition duration-150 ease-in-out"
              >
                Découvrir les fonctionnalités
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-gray-900">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-white">
              Des Outils <span className="text-primary-400">Innovants</span> pour Votre Succès
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                {
                  icon: <FaSearch className="text-primary-400 text-4xl mb-4" />,
                  title: 'Recherche d\'Emploi Intelligente',
                  description: 'Accédez à des milliers d\'offres et utilisez nos filtres avancés pour trouver le job de vos rêves.',
                },
                {
                  icon: <FaFileSignature className="text-primary-400 text-4xl mb-4" />,
                  title: 'Générateur de CV et Lettres de Motivation IA',
                  description: 'Créez des documents professionnels et personnalisés en quelques clics grâce à notre IA.',
                },
                {
                  icon: <FaTasks className="text-primary-400 text-4xl mb-4" />,
                  title: 'Gestion de Candidatures Simplifiée',
                  description: 'Suivez l\'avancement de vos candidatures et organisez votre recherche d\'emploi efficacement.',
                },
                {
                  icon: <FaLightbulb className="text-primary-400 text-4xl mb-4" />,
                  title: 'Suggestions Personnalisées',
                  description: 'Recevez des recommandations d\'offres et de compétences basées sur votre profil unique.',
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-800 p-8 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center text-center"
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <div className="flex justify-center md:justify-start">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold text-white mt-2 mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why JobNexAI Section */}
        <section className="py-20 px-4 bg-gray-800">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-white">Pourquoi Choisir <span className="text-primary-400">JobNexAI</span> ?</h2>
            <p className="max-w-3xl mx-auto text-lg text-gray-300 mb-12">
              Nous combinons technologie de pointe et expertise en recrutement pour vous offrir une plateforme unique. JobNexAI n'est pas seulement un moteur de recherche d'emploi, c'est votre partenaire de carrière intelligent, conçu pour maximiser vos chances de succès et simplifier chaque étape de votre parcours.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                    <FaRocket className="text-primary-500 text-3xl mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-2">Efficacité Maximale</h3>
                    <p className="text-gray-400">Gagnez du temps et concentrez-vous sur ce qui compte vraiment.</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                    <FaShieldAlt className="text-primary-500 text-3xl mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-2">Données Protégées</h3>
                    <p className="text-gray-400">Votre vie privée est notre priorité. Sécurité de niveau entreprise.</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
                    <FaLanguage className="text-primary-500 text-3xl mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-2">Support Multilingue</h3>
                    <p className="text-gray-400">Utilisez JobNexAI dans la langue de votre choix.</p>
                </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 px-4 bg-primary-600 text-center">
            <div className="container mx-auto">
                <h2 className="text-4xl font-bold text-white mb-6">Prêt à Transformer Votre Carrière ?</h2>
                <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
                    Rejoignez des milliers d'utilisateurs qui font confiance à JobNexAI pour atteindre leurs objectifs professionnels.
                </p>
                <Link
                    to="/register"
                    className="bg-white hover:bg-gray-100 text-primary-600 font-semibold py-4 px-10 rounded-lg text-xl shadow-xl transition duration-150 ease-in-out transform hover:scale-105"
                >
                    Inscrivez-vous Maintenant !
                </Link>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 py-10 px-4 border-t border-gray-700">
        <div className="container mx-auto text-center text-gray-400">
          <div className="mb-4">
            <Link to="/about" className="px-3 hover:text-primary-400">À Propos</Link>
            <Link to="/contact" className="px-3 hover:text-primary-400">Contact</Link>
            <Link to="/privacy" className="px-3 hover:text-primary-400">Politique de Confidentialité</Link>
            <Link to="/terms" className="px-3 hover:text-primary-400">Conditions d'Utilisation</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} JobNexAI. Tous droits réservés.</p>
          <p className="text-sm mt-2">Propulsé avec <span className="text-red-500">&hearts;</span> par l'IA et la passion.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
