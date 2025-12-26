# 🔍 Diagnostic de l'erreur "Erreur lors de l'enregistrement"

## ❌ Erreur actuelle
```json
{
    "success": false,
    "error": {
        "message": "Erreur lors de l'enregistrement",
        "code": "BUSINESS_RULE_ERROR",
        "statusCode": 400
    }
}
```

## 📋 Cause racine
**Erreur PGRST116: "Cannot coerce the result to a single JSON object"**

Cette erreur signifie que:
1. ✅ La table `users` existe dans Supabase Cloud
2. ❌ Mais l'insertion ne retourne aucune ligne (probablement bloquée)
3. Le code appelle `.single()` qui attend exactement 1 ligne

## 🔧 Solutions possibles

### Solution 1: Vérifier que les migrations sont complètes (⭐ RECOMMANDÉ)

**Les migrations incluent les permissions GRANT qui sont essentielles:**

```sql
-- Ces lignes doivent être dans ALL_MIGRATIONS_COMBINED.sql (lignes 149-162)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
```

**Action requise:**
1. Ouvrir: https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg/sql/new
2. Vérifier que `ALL_MIGRATIONS_COMBINED.sql` a été exécuté **entièrement**
3. Si non, copier-coller et exécuter **TOUT** le fichier SQL

### Solution 2: Vérifier RLS (Row Level Security)

Si RLS est activé sur la table `users`, il peut bloquer les insertions:

1. Aller dans **Authentication > Policies** dans Supabase Dashboard
2. Vérifier si `users` a des policies RLS activées
3. Si oui, soit:
   - Désactiver RLS temporairement: `ALTER TABLE users DISABLE ROW LEVEL SECURITY;`
   - Ou créer une policy qui permet les insertions

### Solution 3: Vérifier directement dans Supabase Dashboard

1. Aller dans **Table Editor**
2. Cliquer sur la table `users`
3. Essayer d'insérer manuellement une ligne
4. Si ça ne marche pas, l'erreur sera affichée clairement

## 🧪 Test après correction

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "full_name": "Test User",
      "email": "test@example.com",
      "role": "client"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 📝 Logs améliorés

Le code a été amélioré pour donner plus de détails sur les erreurs. Vérifiez `/tmp/api_server.log` pour voir l'erreur complète:

```bash
tail -20 /tmp/api_server.log | grep -A 3 "error"
```

## ✅ Checklist de vérification

- [ ] Le fichier `ALL_MIGRATIONS_COMBINED.sql` a été exécuté dans Supabase Cloud
- [ ] Les permissions GRANT ont été appliquées
- [ ] RLS est désactivé ou configuré correctement
- [ ] Le serveur API utilise la bonne clé `service_role`
- [ ] Les tables existent dans Table Editor

