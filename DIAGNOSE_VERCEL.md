# 🔍 Diagnostic Vercel - Erreur d'initialisation

## Erreur actuelle
```json
{
  "success": false,
  "error": {
    "message": "Erreur d'initialisation du serveur. Vérifiez les variables d'environnement.",
    "code": "INIT_ERROR",
    "statusCode": 500
  }
}
```

## 📋 Checklist de diagnostic

### 1. Vérifier les variables d'environnement dans Vercel

**Allez sur Vercel Dashboard :**
1. Votre projet → **Settings** → **Environment Variables**
2. Vérifiez que ces variables existent pour **Production** :

| Variable | Doit être | Vérification |
|----------|-----------|--------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Commence par `https://` |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` | Longue chaîne JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Longue chaîne JWT |
| `JWT_SECRET` | `a1b2c3d4...` | Minimum 32 caractères |
| `NODE_ENV` | `production` | Exactement `production` |

### 2. Consulter les logs Vercel (IMPORTANT)

**Via Dashboard :**
1. Vercel Dashboard → Votre projet
2. **Deployments** → Cliquez sur le dernier déploiement
3. **Functions** → Cliquez sur `api/index`
4. **Logs** → Cherchez les lignes avec `=== APP INITIALIZATION FAILED ===`

Vous devriez voir :
```
=== APP INITIALIZATION FAILED ===
Error Message: ...
Error Name: ...
Available env vars: ...
==================================
```

### 3. Test rapide - Vérifier les variables

**Via Vercel CLI :**
```bash
vercel env ls
```

Cela liste toutes les variables d'environnement configurées.

### 4. Causes possibles

#### A. Variables manquantes
- **Symptôme** : `Error Message: Missing required environment variables: SUPABASE_URL, ...`
- **Solution** : Ajoutez les variables manquantes dans Vercel Settings → Environment Variables

#### B. Variables vides ou incorrectes
- **Symptôme** : Variables présentes mais vides
- **Solution** : Vérifiez que les valeurs ne sont pas vides (pas d'espaces seulement)

#### C. Format incorrect
- **Symptôme** : `SUPABASE_URL` ne commence pas par `https://`
- **Solution** : Vérifiez le format des URLs et des clés

#### D. Problème d'import TypeScript
- **Symptôme** : Erreur de compilation ou d'import
- **Solution** : Vérifiez les logs de build Vercel

### 5. Solution immédiate

**Étape 1 : Vérifiez les logs Vercel**
- Les logs devraient maintenant afficher l'erreur exacte
- Notez le message d'erreur complet

**Étape 2 : Ajoutez les variables manquantes**
- Si des variables manquent, ajoutez-les dans Vercel
- Assurez-vous qu'elles sont pour **Production**

**Étape 3 : Redéployez**
- Après avoir ajouté les variables, redéployez :
  ```bash
  vercel --prod
  ```
  Ou depuis Dashboard : Deployments → Redeploy

### 6. Test après correction

Une fois les variables ajoutées et redéployées :

```bash
# Test health check
curl https://travelci-backend.vercel.app/health

# Devrait retourner :
# {
#   "status": "ok",
#   "timestamp": "...",
#   "uptime": ...
# }
```

---

## 🆘 Si le problème persiste

1. **Partagez les logs Vercel** (section avec `=== APP INITIALIZATION FAILED ===`)
2. **Vérifiez que vous avez bien redéployé** après avoir ajouté les variables
3. **Vérifiez le format des variables** (pas d'espaces, pas de guillemets superflus)

---

## 📝 Note importante

Les variables d'environnement doivent être configurées **avant** le déploiement, ou vous devez **redéployer** après les avoir ajoutées. Vercel ne recharge pas automatiquement les variables pour un déploiement existant.

