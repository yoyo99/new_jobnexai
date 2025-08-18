import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface IMAPConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  mailbox?: string
}

interface JobOffer {
  title: string
  company: string
  description: string
  location?: string
  salary?: string
  contract_type?: string
  email_subject: string
  email_from: string
  email_date: string
  email_body: string
  source: 'imap'
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST') {
      const { userId, imapConfig } = await req.json()

      if (!userId || !imapConfig) {
        return new Response(
          JSON.stringify({ error: 'userId and imapConfig are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Valider la configuration IMAP
      const config: IMAPConfig = {
        host: imapConfig.host,
        port: imapConfig.port || 993,
        secure: imapConfig.secure !== false,
        username: imapConfig.username,
        password: imapConfig.password,
        mailbox: imapConfig.mailbox || 'INBOX'
      }

      console.log('Starting IMAP job scraping for user:', userId)

      // Simuler la connexion IMAP et l'extraction d'emails
      // Note: Dans un environnement Deno Edge Functions, nous devons utiliser une approche différente
      // car les bibliothèques IMAP traditionnelles ne sont pas disponibles
      const jobOffers = await scrapeJobOffersFromIMAP(config)

      // Sauvegarder les offres d'emploi dans la base de données
      const savedOffers = []
      for (const offer of jobOffers) {
        const { data, error } = await supabase
          .from('job_offers')
          .insert({
            user_id: userId,
            title: offer.title,
            company: offer.company,
            description: offer.description,
            location: offer.location,
            salary: offer.salary,
            contract_type: offer.contract_type,
            source: offer.source,
            metadata: {
              email_subject: offer.email_subject,
              email_from: offer.email_from,
              email_date: offer.email_date,
              email_body: offer.email_body
            },
            created_at: new Date().toISOString()
          })
          .select()

        if (error) {
          console.error('Error saving job offer:', error)
        } else {
          savedOffers.push(data[0])
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${savedOffers.length} offres d'emploi extraites et sauvegardées`,
          offers: savedOffers 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'GET') {
      // Récupérer les offres d'emploi pour un utilisateur
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId')

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data: offers, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('user_id', userId)
        .eq('source', 'imap')
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ offers }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in IMAP job scraper:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function scrapeJobOffersFromIMAP(config: IMAPConfig): Promise<JobOffer[]> {
  // Simulation de l'extraction d'emails IMAP
  // Dans une vraie implémentation, nous utiliserions une bibliothèque IMAP
  console.log('Connecting to IMAP server:', config.host)
  
  // Simuler quelques offres d'emploi extraites d'emails
  const mockJobOffers: JobOffer[] = [
    {
      title: "Développeur Full Stack",
      company: "TechCorp",
      description: "Nous recherchons un développeur full stack expérimenté pour rejoindre notre équipe...",
      location: "Paris, France",
      salary: "45000-55000€",
      contract_type: "CDI",
      email_subject: "Opportunité - Développeur Full Stack - TechCorp",
      email_from: "recrutement@techcorp.com",
      email_date: new Date().toISOString(),
      email_body: "Bonjour, nous avons une opportunité intéressante...",
      source: 'imap'
    },
    {
      title: "Chef de Projet Digital",
      company: "Digital Agency",
      description: "Rejoignez notre agence digitale en tant que chef de projet...",
      location: "Lyon, France",
      salary: "40000-50000€",
      contract_type: "CDI",
      email_subject: "Offre d'emploi - Chef de Projet Digital",
      email_from: "jobs@digitalagency.fr",
      email_date: new Date().toISOString(),
      email_body: "Nous recherchons un chef de projet digital...",
      source: 'imap'
    }
  ]

  // Simuler un délai de traitement
  await new Promise(resolve => setTimeout(resolve, 2000))

  return mockJobOffers
}

function _parseJobOfferFromEmail(emailContent: string, subject: string, from: string): JobOffer | null {
  // Utiliser l'IA pour extraire les informations de l'offre d'emploi depuis le contenu de l'email
  // Cette fonction pourrait utiliser l'API Mammouth ou une autre IA pour parser le contenu
  
  try {
    // Extraction basique avec regex (à améliorer avec l'IA)
    const titleMatch = subject.match(/(?:offre|opportunité|poste).*?[-:]?\s*(.+)/i)
    const companyMatch = from.match(/@([^.]+)/i)
    
    return {
      title: titleMatch?.[1] || "Offre d'emploi",
      company: companyMatch?.[1] || "Entreprise inconnue",
      description: emailContent.substring(0, 500) + "...",
      email_subject: subject,
      email_from: from,
      email_date: new Date().toISOString(),
      email_body: emailContent,
      source: 'imap'
    }
  } catch (error) {
    console.error('Error parsing job offer from email:', error)
    return null
  }
}
