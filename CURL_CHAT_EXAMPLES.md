# Exemples cURL pour tester l'API Chat

## Prérequis - Se connecter pour obtenir le token JWT

### Login (POST /api/auth/login)

**Commande cURL :**
```bash
curl -X POST https://travelci-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'
```

**Pour tester en local :**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "votre-email@example.com",
      "phone": null,
      "role": "client",
      "is_verified": false,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkIiwiZW1haWwiOiJ2b3RyZS1lbWFpbEBleGFtcGxlLmNvbSIsInJvbGUiOiJjbGllbnQifQ..."
  },
  "message": "Connexion réussie"
}
```

**Pour extraire automatiquement le token (Linux/Mac) :**
```bash
TOKEN=$(curl -X POST https://travelci-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"
```

**Ensuite, utilisez la variable $TOKEN dans vos requêtes :**
```bash
curl -X GET "https://travelci-backend.vercel.app/api/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## Inscription (POST /api/auth/register) - Si vous n'avez pas de compte

```bash
curl -X POST https://travelci-backend.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+33123456789",
    "role": "client"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Utilisateur enregistré avec succès"
}
```

---

## Liste des conversations

**⚠️ IMPORTANT : Copiez le `token` de la réponse de login et utilisez-le dans le header `Authorization: Bearer <token>` pour toutes les requêtes suivantes.**

---

## 1. Lister les conversations (GET /api/conversations)

### En tant que client (conversations où vous êtes le client)
```bash
curl -X GET "https://travelci-backend.vercel.app/api/conversations?role=client&page=1&limit=20" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### En tant que propriétaire (conversations où vous êtes le propriétaire)
```bash
curl -X GET "https://travelci-backend.vercel.app/api/conversations?role=owner&page=1&limit=20" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### Sans filtre de rôle (utilise le rôle de l'utilisateur connecté)
```bash
curl -X GET "https://travelci-backend.vercel.app/api/conversations" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### Avec pagination
```bash
curl -X GET "https://travelci-backend.vercel.app/api/conversations?role=client&page=2&limit=10" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "booking_id": "uuid",
        "client_id": "uuid",
        "owner_id": "uuid",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "last_message_at": "2024-01-01T12:00:00Z",
        "client": {
          "id": "uuid",
          "full_name": "John Doe",
          "email": "john@example.com"
        },
        "owner": {
          "id": "uuid",
          "full_name": "Jane Smith",
          "email": "jane@example.com"
        },
        "last_message": {
          "id": "uuid",
          "content": "Bonjour...",
          "message_type": "user",
          "created_at": "2024-01-01T12:00:00Z"
        },
        "unread_count": 2
      }
    ]
  },
  "message": "Conversations récupérées avec succès"
}
```

---

## 2. Obtenir les détails d'une conversation (GET /api/conversations/:id)

```bash
curl -X GET "https://travelci-backend.vercel.app/api/conversations/VOTRE_CONVERSATION_ID" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

---

## 3. Obtenir les messages d'une conversation (GET /api/conversations/:id/messages)

```bash
curl -X GET "https://travelci-backend.vercel.app/api/conversations/VOTRE_CONVERSATION_ID/messages?page=1&limit=50" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "uuid",
      "content": "Bonjour, je suis intéressé par votre propriété.",
      "is_read": false,
      "message_type": "user",
      "created_at": "2024-01-01T10:00:00Z",
      "sender": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": "uuid",
      "content": "Votre réservation a été acceptée.",
      "message_type": "system",
      "created_at": "2024-01-01T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "pages": 1
  },
  "message": "Messages récupérés avec succès"
}
```

---

## 4. Envoyer un message (POST /api/conversations/:id/messages)

```bash
curl -X POST "https://travelci-backend.vercel.app/api/conversations/VOTRE_CONVERSATION_ID/messages" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Bonjour, je suis intéressé par votre propriété."
  }'
```

---

## 5. Marquer un message comme lu (PUT /api/messages/:id/read)

```bash
curl -X PUT "https://travelci-backend.vercel.app/api/messages/VOTRE_MESSAGE_ID/read" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

---

## 6. Obtenir le nombre de messages non lus (GET /api/conversations/:id/unread-count)

```bash
curl -X GET "https://travelci-backend.vercel.app/api/conversations/VOTRE_CONVERSATION_ID/unread-count" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

---

## 7. Créer une conversation (POST /api/conversations)

```bash
curl -X POST "https://travelci-backend.vercel.app/api/conversations" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "VOTRE_BOOKING_ID"
  }'
```

---

## Pour tester en local

Si vous testez en local, remplacez l'URL par :
- `http://localhost:3000` 
- ou `http://192.168.x.x:3000` (votre IP locale)

**Exemple local :**
```bash
curl -X GET "http://localhost:3000/api/conversations?role=client" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

---

## Notes importantes

1. **Token JWT** : Tous les endpoints nécessitent un token JWT valide dans le header `Authorization: Bearer <token>`
2. **Rôle** : Le paramètre `role` est optionnel. S'il n'est pas fourni, le système utilise le rôle de l'utilisateur connecté.
3. **Pagination** : Par défaut, `page=1` et `limit=20`. La limite maximale est 100.
4. **Messages système** : Les messages avec `message_type: "system"` sont créés automatiquement lors des changements de statut de réservation.
5. **Cache** : Les réponses peuvent être mises en cache (vérifiez le header `X-Cache-Status`).

---

## Gestion des erreurs

### Erreur 401 (Non authentifié)
```json
{
  "success": false,
  "error": {
    "message": "Token d'authentification manquant",
    "code": "UNAUTHORIZED",
    "statusCode": 401
  }
}
```

### Erreur 404 (Conversation non trouvée)
```json
{
  "success": false,
  "error": {
    "message": "Conversation non trouvée",
    "code": "NOT_FOUND",
    "statusCode": 404
  }
}
```

### Erreur 400 (Validation)
```json
{
  "success": false,
  "error": {
    "message": "Rôle invalide",
    "code": "VALIDATION_ERROR",
    "statusCode": 400
  }
}
```

