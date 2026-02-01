# Guide: Corriger les mots de passe des utilisateurs de test

## Problème
Les utilisateurs de test (`john@example.com`, `jane@example.com`, `admin@example.com`) ont des hachages de mot de passe invalides dans la base de données de production, ce qui empêche la connexion avec le mot de passe `password123`.

## Solution
Appliquez la migration `010_fix_test_user_passwords.sql` pour mettre à jour les hachages de mot de passe.

## Étapes

### Option 1: Via le Dashboard Supabase (Recommandé)

1. **Connectez-vous au Dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Copiez et exécutez le script suivant** :

```sql
-- Fix password hashes for test users
-- Password: "password123"
UPDATE users 
SET password_hash = '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm'
WHERE email IN ('john@example.com', 'jane@example.com', 'admin@example.com')
  AND (password_hash IS NULL OR password_hash = '$2b$10$rOzJ8K8qK8qK8qK8qK8qKu8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK');

-- Also ensure the users exist with correct data
INSERT INTO users (id, full_name, email, phone, password_hash, role, is_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', '+1234567890', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'client', true),
('00000000-0000-0000-0000-000000000002', 'Jane Owner', 'jane@example.com', '+1234567891', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'owner', true),
('00000000-0000-0000-0000-000000000003', 'Admin User', 'admin@example.com', '+1234567892', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified;
```

4. **Cliquez sur "Run"** pour exécuter le script

5. **Vérifiez le résultat**
   - Vous devriez voir un message de succès
   - Le script met à jour les utilisateurs existants et crée ceux qui n'existent pas

### Option 2: Via Supabase CLI

Si vous avez configuré Supabase CLI :

```bash
cd /Users/princesaoud/web-api/travelci-backend-
supabase db push
```

Ou pour appliquer uniquement cette migration :

```bash
supabase migration up
```

## Vérification

Après avoir appliqué la migration, testez la connexion dans l'application Flutter :

1. **Client (John Doe)**
   - Email: `john@example.com`
   - Mot de passe: `password123`
   - Cliquez sur "Remplir client" puis "Se connecter"

2. **Propriétaire (Jane Owner)**
   - Email: `jane@example.com`
   - Mot de passe: `password123`
   - Cliquez sur "Remplir propriétaire" puis "Se connecter"

## Notes importantes

- ✅ Cette migration est **sûre** : elle ne modifie que les utilisateurs de test
- ✅ Elle utilise `ON CONFLICT` pour éviter les doublons
- ✅ Les autres utilisateurs ne sont pas affectés
- ✅ Le mot de passe pour tous les utilisateurs de test est : `password123`

## En cas de problème

Si la connexion échoue toujours après avoir appliqué la migration :

1. Vérifiez que la migration a bien été exécutée (vérifiez les logs dans Supabase)
2. Vérifiez que les emails correspondent exactement (sensible à la casse)
3. Vérifiez que le mot de passe saisi est bien `password123` (sans espaces)
4. Consultez les logs du backend pour voir les erreurs d'authentification
