'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Brain, 
  CheckCircle2,
  ArrowRight,
  Linkedin,
  Twitter,
  Github,
  Sparkles,
  Search,
  Rocket,
  Cpu,
  Code,
  Clock,
  Target,
  Zap
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background mesh-gradient relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-purple">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">JobNexAI</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="hidden sm:flex hover:bg-white/5 text-white">
                Connexion
              </Button>
              <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all animate-pulse-glow">
                <Clock className="w-4 h-4 mr-1" />
                Essai 24h Gratuit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left relative z-10">
              <Badge className="mb-6 bg-gradient-secondary text-white border-0 glow-pink animate-shimmer">
                <Zap className="w-3 h-3 mr-1" />
                IA de nouvelle génération
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Trouvez l'emploi de vos rêves avec{" "}
                <span className="gradient-text">JobNexAI</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                Notre IA analyse votre profil et vous connecte aux opportunités parfaitement adaptées à vos compétences. 
                Testez gratuitement pendant 24h.
              </p>
              
              {/* Mini Features in Hero */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span>Matching intelligent</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-5 h-5 text-pink-400" />
                  <span>Alertes en temps réel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <span>Optimisation CV</span>
                </div>
              </div>

              <div className="flex items-center gap-8 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">50K+</div>
                  <div className="text-sm text-muted-foreground">Offres</div>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">95%</div>
                  <div className="text-sm text-muted-foreground">Matching</div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-lg relative z-10">
              <Card className="glass-dark shadow-2xl border-purple-500/20 glow-purple hover-lift">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Essai Gratuit</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    24h d'accès complet, sans carte bancaire
                  </CardDescription>
                  <Badge className="w-fit bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Clock className="w-3 h-3 mr-1" />
                    24h d'essai
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Email</label>
                    <Input 
                      placeholder="votre@email.com" 
                      type="email" 
                      className="bg-black/30 border-purple-500/30 text-white placeholder:text-muted-foreground focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Mot de passe</label>
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
                      className="bg-black/30 border-purple-500/30 text-white placeholder:text-muted-foreground focus:border-purple-500"
                    />
                  </div>
                  <Button className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 text-white shadow-xl glow-purple hover-lift animate-gradient-x">
                    Démarrer l'essai 24h
                    <Rocket className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    5 candidatures incluses. Pas de carte bancaire requise.
                  </p>
                </CardContent>
              </Card>
              
              {/* Floating Tech Icons */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-xl animate-float" style={{ animationDelay: '0.5s' }}>
                <Cpu className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center shadow-xl animate-float" style={{ animationDelay: '1.5s' }}>
                <Code className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-dark card-glow border-purple-500/20 hover:border-purple-500/40 hover-lift">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-3 glow-purple">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">Matching IA</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Analyse intelligente de votre profil pour trouver les offres parfaites
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-dark card-glow border-pink-500/20 hover:border-pink-500/40 hover-lift">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-secondary flex items-center justify-center mb-3 glow-pink">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">Alertes Temps Réel</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Soyez notifié instantanément des nouvelles offres qui vous correspondent
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-dark card-glow border-cyan-500/20 hover:border-cyan-500/40 hover-lift">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mb-3 glow-cyan">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">Optimisation CV</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Améliorez votre CV avec les suggestions de notre IA
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Choisissez votre <span className="gradient-text">plan</span>
            </h2>
            <p className="text-muted-foreground">
              Des offres adaptées à votre profil : chercheur d'emploi ou freelance
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Essai 24h */}
            <Card className="glass-dark card-glow border-purple-500/20 hover:border-purple-500/40 hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl text-white">Essai 24h</CardTitle>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Gratuit
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">0€</span>
                  <span className="text-muted-foreground">/24h</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-white">5 candidatures</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-white">Matching IA complet</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-white">Pas de carte bancaire</span>
                </div>
              </CardContent>
            </Card>

            {/* Objectif Emploi */}
            <Card className="glass-dark border-pink-500/50 shadow-2xl relative glow-pink hover-lift">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-secondary text-white border-0 animate-pulse-glow text-xs">Populaire</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl text-white text-center mb-3">Objectif Emploi</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mensuel</span>
                    <span className="text-2xl font-bold gradient-text">29€/mois</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Annuel</span>
                    <span className="text-2xl font-bold gradient-text">300€/an</span>
                    <span className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-medium rounded-md px-2 py-0.5 whitespace-nowrap">-14%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-white">Candidatures illimitées</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-white">Optimisation CV avancée</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-white">Alertes en temps réel</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-white">Support prioritaire</span>
                </div>
                <Button className="w-full mt-4 bg-gradient-secondary hover:opacity-90 text-white shadow-xl glow-pink animate-gradient-x">
                  Choisir Objectif Emploi
                  <Rocket className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Freelance et indépendant */}
            <Card className="glass-dark card-glow border-cyan-500/20 hover:border-cyan-500/40 hover-lift">
              <CardHeader>
                <CardTitle className="text-xl text-white text-center mb-3">Freelance et indépendant</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mensuel</span>
                    <span className="text-2xl font-bold text-white">29€/mois</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Annuel</span>
                    <span className="text-2xl font-bold text-white">300€/an</span>
                    <span className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-medium rounded-md px-2 py-0.5 whitespace-nowrap">-14%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-white">Accès aux offres freelance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-white">Profil freelance optimisé</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-white">Gestion des devis</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-white">Portefeuille clients</span>
                </div>
                <Button variant="outline" className="w-full mt-4 border-cyan-500/50 text-white hover:bg-cyan-500/10 hover-lift">
                  Choisir
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-dark py-8 px-4 sm:px-6 lg:px-8 border-t border-purple-500/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center glow-purple">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">JobNexAI</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-purple-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-pink-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-cyan-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 JobNexAI. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
