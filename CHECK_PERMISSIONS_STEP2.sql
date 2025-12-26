-- =====================================================
-- ÉTAPE 2: Vérifier les permissions sur la table users
-- Exécuter cette requête après avoir vérifié RLS
-- =====================================================

-- 1. Vérifier les permissions sur users
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 2. Vérifier spécifiquement service_role
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND grantee = 'service_role';

-- 3. Si service_role n'apparaît pas, appliquez ces permissions:
-- GRANT ALL ON TABLE users TO service_role;
-- GRANT ALL ON TABLE users TO anon;
-- GRANT ALL ON TABLE users TO authenticated;

-- 4. Tester une insertion directe (décommentez pour tester):
-- INSERT INTO users (full_name, email, password_hash, role) 
-- VALUES ('Test Direct Insert', 'testdirect@example.com', 'hashtest123', 'client')
-- RETURNING id, email, full_name;

