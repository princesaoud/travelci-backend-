-- =====================================================
-- DIAGNOSTIC SCRIPT - Vérifier les permissions et RLS
-- Exécuter ce script dans Supabase SQL Editor
-- =====================================================

-- 1. Vérifier si la table users existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- 2. Vérifier les permissions sur la table users
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users' AND table_schema = 'public';

-- 3. Vérifier si RLS est activé sur users
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 4. Vérifier les policies RLS (si RLS est activé)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 5. Tester une insertion directe (devrait fonctionner si tout est OK)
-- Décommentez cette ligne pour tester:
-- INSERT INTO users (full_name, email, password_hash, role) 
-- VALUES ('Test Direct', 'testdirect@example.com', 'hash123', 'client')
-- RETURNING id, email;

-- 6. Si l'insertion ci-dessus fonctionne mais pas via API:
-- Appliquez ces permissions (si elles manquent):
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 7. Si RLS est activé et bloque les insertions, désactivez-le temporairement:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- OU créez une policy qui permet les insertions au service_role:
-- CREATE POLICY "Service role can insert users"
-- ON users FOR INSERT
-- TO service_role
-- WITH CHECK (true);

