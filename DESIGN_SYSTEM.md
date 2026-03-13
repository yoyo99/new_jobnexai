# Documentation du Système de Design

## Couleurs Principales

- **Primary**: Orange/rose (38°) - Accent principal
- **Secondary**: Violet (260°) - Accent secondaire
- **Base**: Bleu sombre (220°) - Fondations

## Variables CSS

### Couleurs de base
- "--background": Fond principal
- "--foreground": Texte principal
- "--primary": Couleur d'accentuation
- "--secondary": Couleur secondaire

### Couleurs chart (12 teintes)
- "--chart-1" à "--chart-12": Palette complète pour les graphiques

### Utilisation
```css
/* Bon */
.background { background: hsl(var(--background)); }
.primary-button { background: hsl(var(--primary)); }

/* À éviter */
/* Ne pas redéfinir --border si déjà défini */
```

## Bonnes Pratiques

1. **Cohérence**: Utiliser les variables existantes plutôt que de créer des doublons
2. **Nommage**: Préfixer les variables custom par `--ds-` (ex: `--ds-chart-1`)
3. **Dark Mode**: Toujours tester avec `.dark` pour les overrides
4. **Performance**: Privilégier HSL pour les transitions fluides

## Prochaines étapes

- [ ] Tester tous les composants avec le nouveau système
- [ ] Documenter les composants custom (btn, card, etc.)
- [ ] Créer des stories pour chaque composant
