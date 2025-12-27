# 📝 Guide : Comment obtenir les variables d'environnement

## 🔑 Variables nécessaires pour Vercel

Vous avez besoin de ces variables d'environnement :

1. **SUPABASE_URL** - URL de votre projet Supabase
2. **SUPABASE_ANON_KEY** - Clé publique (anon key)
3. **SUPABASE_SERVICE_ROLE_KEY** - Clé privée (service role key) ⚠️ SECRET
4. **JWT_SECRET** - Secret pour signer les tokens JWT ⚠️ SECRET

---

## 1️⃣ Variables Supabase

### Si vous utilisez Supabase Cloud :

1. **Allez sur [supabase.com](https://supabase.com)** et connectez-vous
2. **Sélectionnez votre projet** (ou créez-en un si nécessaire)
3. **Cliquez sur l'icône ⚙️ Settings** (en bas à gauche)
4. **Allez dans "API"** dans le menu de gauche

Vous verrez :

#### SUPABASE_URL
```
Project URL: https://xxxxxxxxxxxxx.supabase.co
```
➡️ **Copiez cette URL complète** → C'est votre `SUPABASE_URL`

#### SUPABASE_ANON_KEY (Public)
```
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
➡️ **Copiez cette clé** → C'est votre `SUPABASE_ANON_KEY`

#### SUPABASE_SERVICE_ROLE_KEY (Secret ⚠️)
```
service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
➡️ **Copiez cette clé** → C'est votre `SUPABASE_SERVICE_ROLE_KEY`
⚠️ **ATTENTION** : Ne partagez JAMAIS cette clé publiquement ! Elle donne accès complet à votre base de données.

---

## 🔐 Mot de passe de la base de données PostgreSQL

### ⚠️ Important : Vous n'avez PAS besoin du mot de passe DB pour l'API

**L'application actuelle utilise les clés API Supabase** (`SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`) pour accéder à la base de données via l'API REST de Supabase. **Vous n'avez PAS besoin du mot de passe PostgreSQL** pour faire fonctionner l'API.

Cependant, si vous voulez vous connecter **directement à PostgreSQL** avec un client SQL (comme pgAdmin, DBeaver, psql, TablePlus), voici comment obtenir le mot de passe :

### Si vous utilisez Supabase Cloud :

1. **Allez sur [supabase.com](https://supabase.com)** et connectez-vous
2. **Sélectionnez votre projet**
3. **Cliquez sur l'icône ⚙️ Settings** (en bas à gauche)
4. **Allez dans "Database"** dans le menu de gauche

Vous verrez :

#### Database Password (Mot de passe PostgreSQL)

**Option 1 : Si vous avez déjà configuré un mot de passe :**
- Il sera affiché dans la section "Database Settings"
- Cliquez sur "Reset Database Password" si vous avez oublié

**Option 2 : Si c'est un nouveau projet :**
- Le mot de passe a été généré lors de la création du projet
- **⚠️ Si vous ne l'avez pas sauvegardé**, vous devez le réinitialiser :
  1. Cliquez sur "Reset Database Password"
  2. **SAUVEGARDEZ LE MOT DE PASSE** dans un gestionnaire de mots de passe (vous ne pourrez plus le voir après)
  3. Le nouveau mot de passe sera affiché une seule fois

#### Informations de connexion PostgreSQL directe

```
Host: db.xxxxxxxxxxxxx.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [le mot de passe que vous avez obtenu ci-dessus]
```

#### Connexion via psql (ligne de commande)

```bash
psql "postgresql://postgres:[VOTRE_PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

#### Connexion via URL de connexion

Supabase génère aussi une "Connection String" dans Settings → Database :
```
postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

⚠️ **Remplacez `[PASSWORD]` par votre mot de passe réel.**

---

## 2️⃣ JWT_SECRET

### Option 1 : Générer un secret sécurisé (Recommandé)

**Via Node.js :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Via OpenSSL :**
```bash
openssl rand -hex 32
```

**Via Python :**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Via un générateur en ligne :**
- Allez sur [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
- Copiez le secret généré

### Option 2 : Créer un secret personnalisé

Utilisez une phrase longue et complexe, par exemple :
```
my-super-secret-jwt-key-change-this-in-production-2024
```

⚠️ **Recommandation** : Minimum 32 caractères, utilisez des caractères aléatoires.

---

## 3️⃣ Variables optionnelles

### CORS_ORIGIN (si vous avez un domaine Flutter web)
```
https://your-domain.com
```
ou plusieurs domaines séparés par des virgules :
```
https://your-domain.com,https://www.your-domain.com
```

### Rate Limiting (optionnel, valeurs par défaut sont OK)
```
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_GENERAL_MAX=200
RATE_LIMIT_GENERAL_WINDOW_MS=900000
```

---

## 📋 Résumé des variables à obtenir

| Variable | Où l'obtenir | Exemple |
|----------|--------------|---------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role | `eyJhbGci...` |
| `JWT_SECRET` | Générer avec `openssl rand -hex 32` | `a1b2c3d4...` |

---

## 🔧 Comment les ajouter dans Vercel

### Méthode 1 : Via Vercel Dashboard (Recommandé)

1. **Allez sur [vercel.com](https://vercel.com)** et connectez-vous
2. **Sélectionnez votre projet** `travelci-backend`
3. **Cliquez sur "Settings"** (en haut)
4. **Cliquez sur "Environment Variables"** dans le menu de gauche
5. **Pour chaque variable :**
   - Cliquez sur "Add New"
   - Entrez le **Key** (ex: `SUPABASE_URL`)
   - Entrez la **Value** (ex: `https://xxxxx.supabase.co`)
   - Sélectionnez les **Environments** : 
     - ✅ Production
     - ✅ Preview
     - ✅ Development (optionnel)
   - Cliquez sur "Save"

6. **Répétez pour toutes les variables** :
   ```
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   JWT_SECRET
   NODE_ENV=production
   ```

### Méthode 2 : Via Vercel CLI

```bash
# Ajouter une variable pour la production
vercel env add SUPABASE_URL production

# Répétez pour chaque variable
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
vercel env add NODE_ENV production
```

---

## ✅ Vérifier les variables configurées

### Via Dashboard :
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Vous devriez voir toutes vos variables listées

### Via CLI :
```bash
vercel env ls
```

---

## 🔄 Après avoir ajouté les variables

**Important** : Après avoir ajouté/modifié des variables d'environnement, vous devez **redéployer** :

### Option 1 : Redéployer depuis Dashboard
- Vercel Dashboard → Deployments → Cliquez sur "..." → "Redeploy"

### Option 2 : Redéployer via CLI
```bash
vercel --prod
```

### Option 3 : Push un commit
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## 🧪 Tester localement avec les mêmes variables

Créez un fichier `.env.local` :

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

Puis testez :
```bash
npm run dev
```

---

## 🆘 Aide supplémentaire

### Si vous n'avez pas de projet Supabase :

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte (gratuit)
3. Créez un nouveau projet
4. Attendez 2-3 minutes que le projet soit créé
5. Suivez les étapes ci-dessus pour obtenir les clés

### Si vous avez déjà un projet Supabase local :

Pour la production Vercel, vous devez utiliser **Supabase Cloud**, pas la version locale. Créez un projet cloud ou migrez vos données.

---

## 📸 Emplacement dans Supabase Dashboard

### Pour les clés API (utilisées par l'application) :
```
Supabase Dashboard
├── Your Project
    └── Settings (⚙️ icône en bas à gauche)
        └── API
            ├── Project URL → SUPABASE_URL
            ├── anon public → SUPABASE_ANON_KEY
            └── service_role secret → SUPABASE_SERVICE_ROLE_KEY
```

### Pour le mot de passe PostgreSQL (connexion directe uniquement) :
```
Supabase Dashboard
├── Your Project
    └── Settings (⚙️ icône en bas à gauche)
        └── Database
            ├── Connection string → URL complète PostgreSQL
            ├── Database password → Mot de passe PostgreSQL
            └── Reset Database Password → Pour réinitialiser
```

---

## 🤔 Quand utiliser quoi ?

### ✅ Pour l'API Node.js (ce que vous faites actuellement) :
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ **PAS besoin** du mot de passe PostgreSQL

### ✅ Pour une connexion directe à PostgreSQL (pgAdmin, DBeaver, etc.) :
- ✅ Host: `db.xxxxx.supabase.co`
- ✅ Port: `5432`
- ✅ Database: `postgres`
- ✅ User: `postgres`
- ✅ Password: **[le mot de passe de la base de données]**
- ❌ **PAS besoin** des clés API

---

**Une fois toutes les variables configurées dans Vercel, redéployez et votre API devrait fonctionner !** 🚀



