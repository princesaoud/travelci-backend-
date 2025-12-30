# Créer le bucket de fichiers de messages

## Problème
L'erreur "Bucket not found" indique que le bucket `message-files` n'existe pas dans Supabase Storage.

## Solution : Exécuter la migration

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Ouvrir le SQL Editor dans Supabase Dashboard**
   - Allez sur : https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg/sql/new
   - Ou : Dashboard → SQL Editor → New Query

2. **Copier et coller le contenu de la migration**

Copiez tout le contenu du fichier `supabase/migrations/009_create_message_files_bucket.sql` :

```sql
-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-files',
  'message-files',
  true,
  20971520, -- 20MB in bytes
  NULL -- Allow all file types
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for message-files bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access Message Files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload message files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own message files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own message files" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public Access Message Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-files');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload message files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-files' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update own message files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'message-files'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own message files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-files'
  AND auth.role() = 'authenticated'
);
```

3. **Exécuter la requête**
   - Cliquez sur "Run" ou appuyez sur Ctrl+Enter (Cmd+Enter sur Mac)
   - Vous devriez voir "Success. No rows returned"

4. **Vérifier que le bucket existe**
   - Allez dans : Dashboard → Storage
   - Vous devriez voir le bucket `message-files` dans la liste

### Option 2 : Via Supabase CLI (si installé)

```bash
# Si vous utilisez Supabase CLI
supabase db push
```

Cela exécutera toutes les migrations non appliquées, y compris la création du bucket.

## Vérification

Après avoir exécuté la migration, testez l'upload de fichier dans l'application. L'erreur "Bucket not found" devrait disparaître.

## Note

Le service de fichiers a été amélioré pour :
- Détecter automatiquement si le bucket existe
- Essayer de créer le bucket automatiquement (si les permissions le permettent)
- Fournir un message d'erreur plus clair si le bucket n'existe pas

Cependant, la méthode recommandée est d'exécuter la migration SQL dans le dashboard Supabase.

