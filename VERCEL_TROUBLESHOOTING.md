# 🔧 Dépannage Vercel - Erreur 500

## Erreur : FUNCTION_INVOCATION_FAILED (500)

### Corrections appliquées

1. **Suppression de `process.exit(1)`** 
   - Sur Vercel/serverless, `process.exit()` fait crasher la fonction
   - Remplacement par une gestion d'erreur qui utilise le middleware Express

2. **Logger adapté pour Vercel**
   - Sur Vercel, le filesystem est en lecture seule dans certains contextes
   - Le logger utilise maintenant uniquement la console sur Vercel
   - Les logs apparaissent dans Vercel Dashboard → Functions → Logs

3. **Détection automatique de l'environnement Vercel**
   - `api/index.ts` définit `process.env.VERCEL = '1'` avant d'importer l'app
   - Permet d'adapter le comportement pour Vercel

## Vérifications à faire

### 1. Variables d'environnement

Assurez-vous que TOUTES ces variables sont configurées dans Vercel Dashboard :

**Requis :**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-strong-secret-min-32-chars
NODE_ENV=production
```

**Optionnel mais recommandé :**
```env
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_GENERAL_MAX=200
```

### 2. Vérifier les logs Vercel

1. Allez dans Vercel Dashboard
2. Sélectionnez votre projet
3. Cliquez sur "Deployments"
4. Cliquez sur le dernier déploiement
5. Cliquez sur "Functions"
6. Cliquez sur `api/index.ts`
7. Regardez les logs pour voir l'erreur exacte

### 3. Erreurs communes

#### "Missing required environment variables"
- **Solution** : Vérifiez que toutes les variables sont définies dans Vercel Dashboard → Settings → Environment Variables

#### "Cannot find module"
- **Solution** : Vérifiez que tous les packages sont dans `dependencies` (pas `devDependencies`)

#### "Connection timeout" ou erreurs Supabase
- **Solution** : Vérifiez que `SUPABASE_URL` pointe vers Supabase Cloud (pas `127.0.0.1`)

#### "JWT_SECRET is empty"
- **Solution** : Définissez `JWT_SECRET` avec une valeur forte (minimum 32 caractères)

### 4. Tester localement avec les mêmes variables

Testez que votre app fonctionne avec les mêmes variables d'environnement :

```bash
# Créez un .env.local avec les variables de production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
JWT_SECRET=your-secret
NODE_ENV=production

# Testez
npm run dev
```

### 5. Vérifier la structure des fichiers

Assurez-vous que :
- `api/index.ts` existe et exporte l'app
- `vercel.json` est présent à la racine
- Tous les fichiers source sont dans `src/`

## Commandes utiles

### Voir les logs en temps réel (CLI)
```bash
vercel logs --follow
```

### Redéployer
```bash
vercel --prod
```

### Vérifier les variables d'environnement
```bash
vercel env ls
```

## Si le problème persiste

1. **Vérifiez les logs détaillés** dans Vercel Dashboard
2. **Testez un endpoint simple** : `GET /health`
3. **Vérifiez que Supabase est accessible** depuis Vercel
4. **Vérifiez les permissions RLS** dans Supabase (peuvent bloquer les requêtes)

## Debug mode

Pour activer plus de logs, ajoutez temporairement dans Vercel :
```env
NODE_ENV=development
DEBUG=*
```

Attention : Ne laissez pas ça en production pour des raisons de sécurité.

