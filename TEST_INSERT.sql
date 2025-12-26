-- =====================================================
-- TEST D'INSERTION DIRECTE - Pour isoler le problème
-- =====================================================

-- Test 1: Insertion simple (devrait fonctionner)
INSERT INTO users (full_name, email, password_hash, role) 
VALUES ('Test SQL Direct', 'testdirect@example.com', '$2b$10$testhash12345678901234567890', 'client')
RETURNING id, email, full_name, role;

-- Si ça fonctionne, le problème est dans le code Node.js
-- Si ça échoue, il y a une contrainte ou autre problème SQL

-- Test 2: Vérifier les contraintes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
ORDER BY contype;

-- Test 3: Vérifier si l'email existe déjà
SELECT email FROM users WHERE email = 'testdirect@example.com';

-- Si l'email existe, supprimez-le d'abord:
-- DELETE FROM users WHERE email = 'testdirect@example.com';

