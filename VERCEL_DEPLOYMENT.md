# 🚀 Déploiement sur Vercel

Ce guide vous explique comment déployer votre API TravelCI sur Vercel.

## Prérequis

1. Compte Vercel (gratuit) : [https://vercel.com/signup](https://vercel.com/signup)
2. CLI Vercel installé : `npm install -g vercel`
3. Repository Git (GitHub, GitLab, ou Bitbucket) - Vercel peut se connecter automatiquement

## Configuration

### 1. Variables d'environnement

Configurez ces variables dans Vercel Dashboard → Settings → Environment Variables :

**Variables requises :**
```env
# Supabase Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-strong-jwt-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production

# CORS Configuration (votre domaine Flutter web si applicable)
CORS_ORIGIN=https://your-domain.com
```

**Variables optionnelles :**
```env
# Redis (si vous utilisez Upstash Redis ou autre service Redis cloud)
REDIS_URL=redis://your-redis-url

# Rate Limiting (personnalisation)
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_GENERAL_MAX=200
RATE_LIMIT_GENERAL_WINDOW_MS=900000
```

### 2. Build Configuration

Vercel détecte automatiquement TypeScript et Node.js. La configuration est dans `vercel.json`.

**Fichiers de configuration créés :**
- `vercel.json` - Configuration Vercel
- `api/index.ts` - Point d'entrée serverless
- `.vercelignore` - Fichiers à ignorer lors du déploiement

## Déploiement

### Option 1 : Via Vercel Dashboard (Recommandé)

1. **Connecter le repository :**
   - Allez sur [vercel.com/new](https://vercel.com/new)
   - Connectez votre compte GitHub/GitLab/Bitbucket
   - Sélectionnez votre repository `travelci-backend-`

2. **Configurer le projet :**
   - Framework Preset: **Other** (ou laissez Vercel détecter automatiquement)
   - Root Directory: `.` (par défaut)
   - Build Command: `npm run build` (optionnel, Vercel peut le détecter)
   - Output Directory: (laissez vide)
   - Install Command: `npm install`

3. **Ajouter les variables d'environnement :**
   - Cliquez sur "Environment Variables"
   - Ajoutez toutes les variables listées ci-dessus
   - Sélectionnez les environnements (Production, Preview, Development)

4. **Déployer :**
   - Cliquez sur "Deploy"
   - Attendez la fin du build (environ 2-3 minutes)

### Option 2 : Via Vercel CLI

1. **Installer Vercel CLI :**
```bash
npm install -g vercel
```

2. **Se connecter :**
```bash
vercel login
```

3. **Déployer :**
```bash
# Premier déploiement (suivez les instructions)
vercel

# Déploiement en production
vercel --prod
```

4. **Configurer les variables d'environnement :**
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
# ... répétez pour chaque variable
```

## Vérification du déploiement

Après le déploiement, Vercel vous fournira une URL comme :
```
https://your-project.vercel.app
```

### Tester les endpoints :

```bash
# Health check
curl https://your-project.vercel.app/health

# Test d'inscription
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Notes importantes

### 1. **Redis sur Vercel**
- Vercel ne supporte pas les connexions Redis persistantes
- L'application fonctionnera **sans cache** (Redis est optionnel)
- Pour activer le cache, utilisez un service cloud Redis comme :
  - **Upstash Redis** (recommandé pour Vercel) : [https://upstash.com](https://upstash.com)
  - **Redis Cloud** : [https://redis.com/cloud](https://redis.com/cloud)

### 2. **Limitations Vercel**
- **Function timeout** : 30 secondes (configuré dans `vercel.json`)
- **Memory** : 1024 MB (configuré dans `vercel.json`)
- **Cold starts** : Les fonctions serverless peuvent avoir un délai au premier appel (~1-2 secondes)
- **Rate limiting** : Le rate limiting en mémoire fonctionne par instance (pas global)

### 3. **Supabase**
- Assurez-vous d'utiliser **Supabase Cloud** (pas la version locale)
- Configurez correctement les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY`, et `SUPABASE_SERVICE_ROLE_KEY`
- Les migrations doivent être appliquées sur votre instance Supabase Cloud

### 4. **CORS**
- Configurez `CORS_ORIGIN` avec votre domaine Flutter web si applicable
- Les apps mobiles (iOS/Android) n'ont pas besoin de configuration CORS

### 5. **Logs**
- Les logs sont visibles dans Vercel Dashboard → Deployments → [Your Deployment] → Functions → Logs
- Les logs Winston sont également disponibles dans les logs Vercel

## Mise à jour du code

### Via Git (Recommandé)
1. Poussez vos changements vers votre repository Git
2. Vercel redéploiera automatiquement (si activé)

### Via CLI
```bash
vercel --prod
```

## Monitoring

### Logs en temps réel :
```bash
vercel logs --follow
```

### Métriques :
- Vercel Dashboard → Analytics
- Voir les performances, les erreurs, et l'utilisation

## Dépannage

### Erreur : "Function exceeded maximum duration"
- **Solution** : Augmentez `maxDuration` dans `vercel.json` (maximum 60s pour Pro)

### Erreur : "Module not found"
- **Solution** : Vérifiez que tous les packages sont dans `dependencies` (pas `devDependencies`)

### Erreur : "Environment variable not set"
- **Solution** : Vérifiez que toutes les variables d'environnement sont configurées dans Vercel Dashboard

### Erreur de connexion Supabase
- **Solution** : Vérifiez que vous utilisez les bonnes clés Supabase Cloud (pas locales)

## Coûts

**Plan Gratuit Vercel :**
- 100 GB bandwidth/mois
- Fonctions serverless illimitées (avec limitations)
- Domaine personnalisé gratuit

**Pour la production avec beaucoup de trafic :**
- Considérez le plan Pro ($20/mois)
- Fonctions avec timeout jusqu'à 60s
- Plus de bande passante

## URLs après déploiement

Une fois déployé, vous obtiendrez :
- **Production URL** : `https://your-project.vercel.app`
- **Preview URLs** : Pour chaque PR/branche
- **Domaine personnalisé** : Possible (configuration DNS)

Mettez à jour votre app Flutter avec la nouvelle URL de production ! 🚀

