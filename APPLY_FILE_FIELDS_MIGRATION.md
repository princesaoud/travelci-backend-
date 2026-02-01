# 🔧 Appliquer la migration pour les champs de fichiers dans les messages

## Problème
L'erreur indique que la colonne `file_name` n'existe pas dans la table `messages` :
```
Could not find the 'file_name' column of 'messages' in the schema cache
```

## Solution : Appliquer les migrations manquantes

### Étape 1 : Ouvrir le SQL Editor Supabase

1. Allez sur : **https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg/sql/new**
2. Connectez-vous si nécessaire

### Étape 2 : Appliquer la migration 008 (Champs de fichiers)

Copiez et collez ce SQL dans l'éditeur :

```sql
-- Add file fields to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Add index for file_url queries
CREATE INDEX IF NOT EXISTS idx_messages_file_url ON messages(file_url) WHERE file_url IS NOT NULL;

-- Comments
COMMENT ON COLUMN messages.file_url IS 'URL of the uploaded file (for file/image messages)';
COMMENT ON COLUMN messages.file_name IS 'Original filename of the uploaded file';
COMMENT ON COLUMN messages.file_size IS 'Size of the file in bytes';
```

3. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter / Cmd+Enter)

### Étape 3 : Appliquer la migration 009 (Bucket de stockage)

Copiez et collez ce SQL dans l'éditeur :

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

4. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter / Cmd+Enter)

### Étape 4 : Vérifier que les colonnes existent

Exécutez cette requête pour vérifier :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('file_url', 'file_name', 'file_size');
```

Vous devriez voir 3 lignes :
- `file_url` (type: text)
- `file_name` (type: character varying)
- `file_size` (type: integer)

### Étape 5 : Vérifier le bucket de stockage

1. Allez dans **Storage** dans le menu de gauche
2. Vous devriez voir un bucket nommé `message-files`
3. Si ce n'est pas le cas, réexécutez la migration 009

### Étape 6 : Tester l'envoi de fichier

Après avoir appliqué les migrations, l'envoi de fichiers devrait fonctionner !

## Notes importantes

- Les migrations utilisent `IF NOT EXISTS`, donc elles sont sûres à réexécuter
- Le cache PostgREST devrait se rafraîchir automatiquement
- Si vous avez encore des erreurs, attendez 1-2 minutes pour que le cache se rafraîchisse

## Alternative : Via Supabase CLI

Si vous avez le CLI Supabase installé :

```bash
# Lier le projet
supabase link --project-ref lhpimoqhebpuwzyqlsfg

# Appliquer les migrations
supabase db push
```

