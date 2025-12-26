# 🔧 Guide rapide pour corriger l'erreur d'enregistrement

## 🎯 Action immédiate

### Étape 1: Vérifier les permissions (2 minutes)

1. **Ouvrir Supabase SQL Editor:**
   https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg/sql/new

2. **Exécuter le script de diagnostic:**
   - Ouvrir `CHECK_PERMISSIONS.sql`
   - Copier-coller dans SQL Editor
   - Cliquer **Run**

3. **Vérifier les résultats:**
   - Si la table `users` n'existe pas → Exécutez `ALL_MIGRATIONS_COMBINED.sql`
   - Si les permissions `service_role` manquent → Exécutez les GRANT ci-dessous
   - Si RLS est activé → Désactivez-le ou créez une policy

### Étape 2: Appliquer les permissions manquantes

Si le diagnostic montre des permissions manquantes, exécutez ceci:

```sql
-- Permissions essentielles pour l'API
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Permissions pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO service_role, anon, authenticated;
```

### Étape 3: Vérifier/désactiver RLS (si nécessaire)

Si RLS bloque les insertions:

```sql
-- Option 1: Désactiver RLS temporairement
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 2: Créer une policy pour service_role
CREATE POLICY IF NOT EXISTS "Service role full access"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Étape 4: Tester

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

## ✅ Résultat attendu

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

## 🔍 Si ça ne marche toujours pas

1. Vérifier les logs: `tail -20 /tmp/api_server.log`
2. Vérifier que `.env` contient la bonne clé `SUPABASE_SERVICE_ROLE_KEY`
3. Redémarrer l'API: `pkill -f "ts-node" && npm run dev`

