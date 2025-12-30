# 🔧 Correction : SUPABASE_URL incorrect

## ❌ Problème identifié

Vous avez configuré `SUPABASE_URL` avec l'URL PostgreSQL :
```
postgresql://postgres:AazZsnw3Wxp6Ghg@db.lhpimoqhebpuwzyqlsfg.supabase.co:5432/postgres
```

**C'est incorrect !** L'application utilise le client Supabase JS, qui a besoin de l'**URL de l'API Supabase**, pas de l'URL PostgreSQL.

## ✅ Solution

### 1. Obtenir l'URL API Supabase correcte

**Allez sur Supabase Dashboard :**
1. [supabase.com](https://supabase.com) → Votre projet
2. ⚙️ **Settings** (en bas à gauche)
3. **API** (dans le menu de gauche)
4. Cherchez **"Project URL"** (pas "Connection string" ni "Database URL")

Vous devriez voir quelque chose comme :
```
Project URL: https://lhpimoqhebpuwzyqlsfg.supabase.co
```

➡️ **C'est cette URL que vous devez utiliser** pour `SUPABASE_URL`

### 2. Corriger dans Vercel

**Allez sur Vercel Dashboard :**
1. Votre projet → **Settings** → **Environment Variables**
2. Trouvez `SUPABASE_URL`
3. Cliquez sur **...** → **Edit**
4. Remplacez la valeur par l'URL API :
   ```
   https://lhpimoqhebpuwzyqlsfg.supabase.co
   ```
   (Remplacez `lhpimoqhebpuwzyqlsfg` par votre vrai project ID)
5. Cliquez sur **Save**

### 3. Redéployer

**Important** : Après avoir modifié la variable, vous devez redéployer :

**Option 1 : Via Dashboard**
- Vercel Dashboard → Deployments → ... → **Redeploy**

**Option 2 : Via CLI**
```bash
vercel --prod
```

### 4. Vérifier après redéploiement

```bash
curl https://travelci-backend.vercel.app/health
```

Devrait retourner :
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

---

## 📋 Résumé des variables correctes

| Variable | Format correct | Exemple |
|----------|---------------|---------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | `https://lhpimoqhebpuwzyqlsfg.supabase.co` |
| `SUPABASE_ANON_KEY` | JWT token | `eyJhbGci...` (longue chaîne) |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT token | `eyJhbGci...` (longue chaîne) |
| `JWT_SECRET` | Chaîne aléatoire | `a1b2c3d4...` (min 32 caractères) |
| `NODE_ENV` | `production` | `production` |

---

## 🔍 Comment distinguer les URLs

### URL API Supabase (✅ à utiliser)
- Format : `https://xxxxx.supabase.co`
- Commence par `https://`
- Utilisée par le client Supabase JS
- **C'est celle que vous avez dans "Project URL" dans Supabase Dashboard**

### URL PostgreSQL (❌ ne pas utiliser ici)
- Format : `postgresql://postgres:...@db.xxxxx.supabase.co:5432/postgres`
- Commence par `postgresql://`
- Utilisée pour connexion directe PostgreSQL (pgAdmin, psql, etc.)
- **C'est celle que vous avez dans "Connection string" dans Supabase Dashboard**

---

**Une fois corrigé, redéployez et l'API devrait fonctionner !** 🚀

