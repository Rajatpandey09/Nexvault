# Database Setup Instructions

## Supabase Database Schema Setup

1. **Create Tables**
   - Open your Supabase project dashboard
   - Go to the SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL script

2. **Create Storage Bucket**
   ```sql
   -- Run this in Supabase SQL Editor
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('vault-files', 'vault-files', false);
   ```

3. **Setup Storage Policies**
   ```sql
   -- Allow authenticated users to upload files to their own folder
   CREATE POLICY "Users can upload their own files"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'vault-files' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow authenticated users to read their own files
   CREATE POLICY "Users can view their own files"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'vault-files' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow authenticated users to update their own files
   CREATE POLICY "Users can update their own files"
   ON storage.objects FOR UPDATE
   USING (
     bucket_id = 'vault-files' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow authenticated users to delete their own files
   CREATE POLICY "Users can delete their own files"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'vault-files' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   **IMPORTANT SECURITY NOTE:**
   - `SUPABASE_SERVICE_ROLE_KEY` should ONLY be used in server-side code
   - Never expose it to the client
   - Use it only for admin operations that bypass RLS

5. **Verify Setup**
   - Ensure all tables are created
   - Check that RLS is enabled on all tables
   - Verify storage bucket exists
   - Test authentication flow

## Storage Structure

Files are stored in Supabase Storage with this structure:
```
vault-files/
  └── {user_id}/
      └── {file_hash}.{extension}
```

This ensures:
- Each user's files are isolated
- Duplicate files are automatically detected via hash
- Storage is organized and secure

## Database Features

### Security
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Storage policies enforce user isolation
- Service role key kept server-side only

### Performance
- Indexed columns for fast queries
- Full-text search on content
- Optimized for common access patterns

### Data Isolation
- Complete user data separation
- Cascade deletes on user removal
- No cross-user data leaks

### Storage Quota
- 1 GB per user limit enforced in application
- Storage usage calculated via `get_user_storage_usage()` function
- Real-time tracking of space used
