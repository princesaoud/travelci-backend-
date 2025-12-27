# 🔧 Fix Vercel Serverless Function Crash

## ✅ Corrections apportées

J'ai amélioré la gestion d'erreurs pour éviter les crashes :

1. **`api/index.ts`** : Wrapper l'import de l'app dans un try-catch pour capturer les erreurs d'initialisation
2. **`src/app.ts`** : Ajout d'une vérification des variables d'environnement avec messages d'erreur clairs au lieu de crash

## 🚀 Prochaines étapes

### 1. Vérifier vos variables d'environnement dans Vercel

**Allez sur Vercel Dashboard :**
1. Votre projet → **Settings** → **Environment Variables**
2. Vérifiez que ces variables existent pour **Production** :

```
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ JWT_SECRET
✅ NODE_ENV=production
```

### 2. Comment voir l'erreur exacte maintenant

Avec les corrections, même si les variables manquent, l'API devrait maintenant retourner une erreur HTTP au lieu de crash :

```json
{
  "success": false,
  "error": {
    "message": "Erreur de configuration : Variables d'environnement manquantes",
    "code": "ENV_VALIDATION_ERROR",
    "details": "Missing required environment variables: SUPABASE_URL, ...",
    "statusCode": 500
  }
}
```

### 3. Tester l'endpoint /health

```bash
curl https://your-app.vercel.app/health
```

**Si les variables manquent :**
```json
{
  "status": "error",
  "message": "Service unavailable: Configuration error",
  "timestamp": "2024-..."
}
```

**Si tout est OK :**
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.45
}
```

### 4. Consulter les logs Vercel

**Via Dashboard :**
1. Vercel Dashboard → Votre projet
2. **Deployments** → Cliquez sur le dernier déploiement
3. **Functions** → Cliquez sur `api/index`
4. Vous verrez les logs détaillés avec les erreurs exactes

**Via CLI :**
```bash
vercel logs --follow
```

### 5. Redéployer après avoir ajouté les variables

**Important** : Après avoir ajouté/modifié des variables d'environnement :

```bash
# Option 1 : Redéployer via CLI
vercel --prod

# Option 2 : Depuis Dashboard
# Vercel Dashboard → Deployments → Cliquez sur "..." → "Redeploy"
```

---

## 📋 Checklist de résolution

- [ ] Vérifier que toutes les variables d'environnement sont configurées dans Vercel
- [ ] Tester `/health` pour voir le message d'erreur exact
- [ ] Consulter les logs Vercel pour les détails
- [ ] Redéployer après avoir ajouté les variables
- [ ] Tester à nouveau l'API

---

## 🔍 Diagnostic

Si après avoir ajouté les variables, l'API crash encore :

1. **Vérifiez les logs Vercel** (voir étape 4)
2. **Testez localement** avec les mêmes variables :
   ```bash
   # Créez .env.local avec vos variables Vercel
   NODE_ENV=production npm run dev
   ```
3. **Vérifiez le format des variables** :
   - Pas d'espaces au début/fin
   - Pas de guillemets autour des valeurs (sauf si nécessaire)
   - Valeurs correctes pour Supabase (commencent par `https://` pour URL)

---

## ✅ Si tout fonctionne

Une fois les variables configurées et redéployées, testez :

```bash
# Health check
curl https://your-app.vercel.app/health

# Root endpoint
curl https://your-app.vercel.app/

# Test registration
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

---

**Les corrections sont prêtes. Vérifiez vos variables d'environnement et redéployez !** 🚀

