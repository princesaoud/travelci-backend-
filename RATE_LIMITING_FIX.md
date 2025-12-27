# 🔧 Correction du Rate Limiting

## Problème résolu
L'erreur **"Trop de tentatives de connexion, veuillez réessayer plus tard"** était due à des limites trop restrictives (5 requêtes par 15 minutes) pour le développement.

## Solutions appliquées

### 1. **Limites augmentées pour le développement**
- **Avant**: 5 requêtes / 15 minutes pour l'authentification
- **Maintenant**: 20 requêtes / 15 minutes pour l'authentification
- **Avant**: 100 requêtes / 15 minutes pour les autres endpoints
- **Maintenant**: 200 requêtes / 15 minutes

### 2. **Configuration via variables d'environnement**
Vous pouvez maintenant personnaliser les limites dans votre `.env` :

```env
# Rate Limiting - Auth endpoints (register, login)
RATE_LIMIT_AUTH_MAX=20          # Nombre de requêtes autorisées
RATE_LIMIT_AUTH_WINDOW_MS=900000 # Fenêtre de temps en ms (15 min = 900000)

# Rate Limiting - Autres endpoints
RATE_LIMIT_GENERAL_MAX=200       # Nombre de requêtes autorisées
RATE_LIMIT_GENERAL_WINDOW_MS=900000 # Fenêtre de temps en ms
```

### 3. **Exclusions automatiques**
Les endpoints suivants ne sont **pas** soumis au rate limiting :
- `/health` - Health check
- `/` - Root endpoint

## Comment réinitialiser le rate limiting

### Option 1: Redémarrer le serveur (recommandé)
```bash
# Arrêter le serveur
pkill -f "ts-node.*app.ts"

# Redémarrer
npm run dev
```

### Option 2: Attendre la fin de la fenêtre
- Pour l'authentification: 15 minutes après votre dernière requête
- Les compteurs sont stockés en mémoire et se réinitialisent au redémarrage

## Limites actuelles (par défaut)

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/api/auth/*` (register, login) | **20 requêtes** | 15 minutes |
| `/api/properties/*` | 30 requêtes | 1 minute |
| `/api/bookings/*` | 200 requêtes | 15 minutes |
| `/api/images/*` | 10 requêtes | 1 heure |
| Autres endpoints | 200 requêtes | 15 minutes |

## Pour la production

En production, vous pouvez utiliser des limites plus strictes :

```env
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_GENERAL_MAX=100
```

## Test

Testez maintenant sans problème :

```bash
# Plusieurs tentatives de login/register possibles
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Le serveur a été redémarré avec les nouvelles configurations. 🚀

