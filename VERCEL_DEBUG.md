# 🔍 Debug Vercel Serverless Function Crash

## Erreur actuelle
```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

## Causes possibles

### 1. Variables d'environnement manquantes ⚠️ (Le plus probable)

Vérifiez que toutes ces variables sont configurées dans Vercel :

1. **Allez sur Vercel Dashboard** → Votre projet → Settings → Environment Variables
2. **Vérifiez que ces variables existent pour Production :**
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `JWT_SECRET`
   - ✅ `NODE_ENV=production`

### 2. Comment vérifier les logs Vercel

**Méthode 1 : Via Dashboard**
1. Vercel Dashboard → Votre projet
2. Cliquez sur "Deployments"
3. Cliquez sur le déploiement qui a échoué
4. Cliquez sur "Functions" dans le menu
5. Cliquez sur `api/index` pour voir les logs détaillés

**Méthode 2 : Via CLI**
```bash
vercel logs --follow
```

### 3. Commandes de diagnostic

**Vérifier les variables d'environnement configurées :**
```bash
vercel env ls
```

**Test local avec les mêmes variables :**
```bash
# Copiez vos variables Vercel dans un fichier .env.local
# Puis testez :
NODE_ENV=production npm run build
node dist/app.js
```

### 4. Solution rapide : Ajouter un handler d'erreur dans api/index.ts

Le problème peut venir d'une erreur lors du chargement du module. Il faut wrapper l'import dans un try-catch.

### 5. Test de l'endpoint /health

Même si la fonction crash au démarrage, essayez d'appeler :
```
GET https://your-app.vercel.app/health
```

Si ça fonctionne, le problème est ailleurs. Si ça crash aussi, c'est bien un problème d'initialisation.

---

## Checklist de diagnostic

- [ ] Variables d'environnement configurées dans Vercel
- [ ] Logs Vercel consultés (Dashboard → Deployments → Functions)
- [ ] Test local avec les mêmes variables
- [ ] Redéploiement après ajout des variables
- [ ] Vérification que toutes les variables sont pour "Production"

---

## Solution immédiate

1. **Vérifiez vos variables d'environnement dans Vercel**
2. **Redéployez** après avoir ajouté/modifié les variables
3. **Consultez les logs** pour voir l'erreur exacte

