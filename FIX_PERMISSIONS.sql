-- =====================================================
-- CORRECTION DES PERMISSIONS - Exécuter si permissions manquantes
-- =====================================================

-- 1. Vérifier les permissions actuelles
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY grantee;

-- 2. Appliquer les permissions nécessaires
-- (Exécutez ces commandes UNE PAR UNE si des permissions manquent)

-- Pour service_role (utilisé par l'API backend)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON TABLE users TO service_role;
GRANT ALL ON TABLE properties TO service_role;
GRANT ALL ON TABLE bookings TO service_role;

-- Pour anon (optionnel, pour certaines opérations publiques)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON TABLE users TO anon;
GRANT ALL ON TABLE properties TO anon;
GRANT ALL ON TABLE bookings TO anon;

-- Pour authenticated (optionnel, pour utilisateurs authentifiés)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE properties TO authenticated;
GRANT ALL ON TABLE bookings TO authenticated;

-- 3. Vérifier les permissions après correction
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND grantee IN ('service_role', 'anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 4. Tester une insertion directe
-- INSERT INTO users (full_name, email, password_hash, role) 
-- VALUES ('Test After Fix', 'testfix@example.com', 'hash123', 'client')
-- RETURNING id, email;

