const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Données d'exemple pour les offres d'emploi
const sampleJobs = [
  {
    title: 'Développeur Full Stack React/Node.js',
    company: 'TechCorp',
    company_logo: 'https://ui-avatars.com/api/?name=TechCorp&background=6366f1&color=fff&size=48',
    location: 'Paris, France',
    job_type: 'FULL_TIME',
    remote_type: 'hybrid',
    experience_level: 'mid',
    salary_min: 45000,
    salary_max: 65000,
    currency: 'EUR',
    description: 'Nous recherchons un développeur Full Stack expérimenté pour rejoindre notre équipe. Vous travaillerez sur des projets innovants utilisant React, Node.js et PostgreSQL.',
    requirements: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Git'],
    benefits: ['Télétravail hybride', 'Mutuelle', 'RTT', 'Formation continue'],
    posted_at: new Date().toISOString(),
    url: 'https://example.com/job/1',
    tags: ['React', 'Node.js', 'TypeScript', 'PostgreSQL']
  },
  {
    title: 'Designer UX/UI Senior',
    company: 'DesignStudio',
    company_logo: 'https://ui-avatars.com/api/?name=DesignStudio&background=ec4899&color=fff&size=48',
    location: 'Lyon, France',
    job_type: 'FULL_TIME',
    remote_type: 'remote',
    experience_level: 'senior',
    salary_min: 50000,
    salary_max: 70000,
    currency: 'EUR',
    description: 'Rejoignez notre équipe créative en tant que Designer UX/UI Senior. Vous concevrez des interfaces utilisateur exceptionnelles pour nos clients.',
    requirements: ['Figma', 'Adobe Creative Suite', 'Prototypage', 'Design System', 'User Research'],
    benefits: ['100% remote', 'Équipement fourni', 'Congés illimités', 'Budget formation'],
    posted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/job/2',
    tags: ['UX', 'UI', 'Figma', 'Design System']
  },
  {
    title: 'Data Scientist Python',
    company: 'DataTech',
    company_logo: 'https://ui-avatars.com/api/?name=DataTech&background=10b981&color=fff&size=48',
    location: 'Toulouse, France',
    job_type: 'FULL_TIME',
    remote_type: 'onsite',
    experience_level: 'mid',
    salary_min: 55000,
    salary_max: 75000,
    currency: 'EUR',
    description: 'Nous cherchons un Data Scientist pour analyser nos données et développer des modèles prédictifs. Expertise en Python et Machine Learning requise.',
    requirements: ['Python', 'Pandas', 'Scikit-learn', 'TensorFlow', 'SQL', 'Statistics'],
    benefits: ['Tickets restaurant', 'CE', 'Primes sur objectifs', 'Flex time'],
    posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/job/3',
    tags: ['Python', 'Machine Learning', 'Data Science', 'SQL']
  },
  {
    title: 'Développeur Mobile Flutter',
    company: 'MobileApp Inc',
    company_logo: 'https://ui-avatars.com/api/?name=MobileApp&background=f59e0b&color=fff&size=48',
    location: 'Nantes, France',
    job_type: 'CONTRACT',
    remote_type: 'hybrid',
    experience_level: 'junior',
    salary_min: 35000,
    salary_max: 45000,
    currency: 'EUR',
    description: 'Développez des applications mobiles innovantes avec Flutter. Poste idéal pour un développeur junior motivé.',
    requirements: ['Flutter', 'Dart', 'Firebase', 'REST API', 'Git'],
    benefits: ['Mentorat senior', 'Formation Flutter', 'Projet portfolio', 'Évolution rapide'],
    posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/job/4',
    tags: ['Flutter', 'Dart', 'Mobile', 'Firebase']
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudSystems',
    company_logo: 'https://ui-avatars.com/api/?name=CloudSystems&background=8b5cf6&color=fff&size=48',
    location: 'Bordeaux, France',
    job_type: 'FULL_TIME',
    remote_type: 'remote',
    experience_level: 'senior',
    salary_min: 60000,
    salary_max: 80000,
    currency: 'EUR',
    description: 'Rejoignez notre équipe DevOps pour gérer notre infrastructure cloud et automatiser nos déploiements.',
    requirements: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
    benefits: ['Remote first', 'Stock options', 'Conférences payées', 'Matériel haut de gamme'],
    posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/job/5',
    tags: ['DevOps', 'Docker', 'Kubernetes', 'AWS']
  },
  {
    title: 'Stage Développement Web',
    company: 'WebAgency',
    company_logo: 'https://ui-avatars.com/api/?name=WebAgency&background=ef4444&color=fff&size=48',
    location: 'Marseille, France',
    job_type: 'INTERNSHIP',
    remote_type: 'onsite',
    experience_level: 'junior',
    salary_min: 600,
    salary_max: 1000,
    currency: 'EUR',
    description: 'Stage de 6 mois en développement web. Apprenez les technologies modernes dans une agence dynamique.',
    requirements: ['HTML', 'CSS', 'JavaScript', 'Motivation', 'Curiosité'],
    benefits: ['Encadrement expérimenté', 'Projets variés', 'Possibilité d\'embauche', 'Tickets restaurant'],
    posted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://example.com/job/6',
    tags: ['Stage', 'HTML', 'CSS', 'JavaScript']
  }
];

// Données d'exemple pour les projets freelance
const sampleFreelanceProjects = [
  {
    title: 'Développement site e-commerce Shopify',
    client_company: 'Fashion Store',
    location: 'Remote',
    project_type: 'web_development',
    is_remote: true,
    budget_min: 3000,
    budget_max: 5000,
    duration: '2-3 mois',
    required_experience_level: 'mid',
    required_skills: ['Shopify', 'Liquid', 'JavaScript', 'CSS'],
    description: 'Création d\'un site e-commerce sur Shopify avec personnalisations avancées. Design moderne et responsive requis.',
    status: 'active',
    posted_at: new Date().toISOString()
  },
  {
    title: 'Application mobile React Native',
    client_company: 'Startup Health',
    location: 'Paris, France',
    project_type: 'mobile_development',
    is_remote: false,
    budget_min: 8000,
    budget_max: 12000,
    duration: '4-6 mois',
    required_experience_level: 'senior',
    required_skills: ['React Native', 'TypeScript', 'Firebase', 'API REST'],
    description: 'Développement d\'une application mobile de santé avec fonctionnalités avancées.',
    status: 'active',
    posted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    title: 'Refonte identité visuelle complète',
    client_company: 'Restaurant Chain',
    location: 'Remote',
    project_type: 'design',
    is_remote: true,
    budget_min: 2000,
    budget_max: 4000,
    duration: '1-2 mois',
    required_experience_level: 'mid',
    required_skills: ['Branding', 'Logo Design', 'Adobe Illustrator', 'Photoshop'],
    description: 'Refonte complète de l\'identité visuelle d\'une chaîne de restaurants.',
    status: 'active',
    posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Début du seeding de la base de données...');

    // Insérer les offres d'emploi
    console.log('📝 Insertion des offres d\'emploi...');
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .insert(sampleJobs)
      .select();

    if (jobsError) {
      console.error('❌ Erreur lors de l\'insertion des jobs:', jobsError);
    } else {
      console.log(`✅ ${jobsData.length} offres d'emploi insérées`);
    }

    // Insérer les projets freelance
    console.log('💼 Insertion des projets freelance...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('freelance_projects')
      .insert(sampleFreelanceProjects)
      .select();

    if (projectsError) {
      console.error('❌ Erreur lors de l\'insertion des projets freelance:', projectsError);
    } else {
      console.log(`✅ ${projectsData.length} projets freelance insérés`);
    }

    console.log('🎉 Seeding terminé avec succès !');

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

// Exécuter le seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleJobs, sampleFreelanceProjects };
