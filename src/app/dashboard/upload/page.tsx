'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, FileText, FileImage, File as FileIcon, Loader } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { translations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { calculateHash, formatFileSize, getFileExtension, isValidFileType } from '@/utils/helpers';
import { useToast } from '@/components/ui/ToastContainer';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { language, user } = useAppStore();
  const t = translations[language];
  const { showToast } = useToast();

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB per file
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    // Check storage quota
    const { data: storageData } = await supabase.rpc('get_user_storage_usage', {
      user_uuid: user?.id,
    });

    const currentUsage = storageData || 0;
    const quota = 1073741824; // 1GB
    const totalNewSize = files.reduce((sum, f) => sum + f.file.size, 0);

    if (currentUsage + totalNewSize > quota) {
      showToast('error', t.storageLimitReached);
      setUploading(false);
      return;
    }

    for (const uploadFile of files) {
      if (uploadFile.status !== 'pending') continue;

      try {
        // Update status
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f))
        );

        // Validate file type
        if (!isValidFileType(uploadFile.file.type)) {
          throw new Error('File type not supported');
        }

        // Calculate file hash
        const hash = await calculateHash(uploadFile.file);

        // Check for duplicates
        const { data: existingFile } = await supabase
          .from('files')
          .select('id')
          .eq('user_id', user?.id)
          .eq('hash', hash)
          .eq('is_deleted', false)
          .single();

        if (existingFile) {
          throw new Error(t.duplicateFile);
        }

        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 30 } : f))
        );

        // Upload to Supabase Storage
        const extension = getFileExtension(uploadFile.file.name);
        const storagePath = `${user?.id}/${hash}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('vault-files')
          .upload(storagePath, uploadFile.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: 70 } : f))
        );

        // Create database record
        const { error: dbError } = await supabase.from('files').insert({
          user_id: user?.id,
          filename: `${hash}.${extension}`,
          original_filename: uploadFile.file.name,
          mime_type: uploadFile.file.type,
          extension,
          size: uploadFile.file.size,
          hash,
          storage_path: storagePath,
          extraction_status: 'pending',
        });

        if (dbError) throw dbError;

        // Success
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f))
        );
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'error', error: error.message } : f
          )
        );
      }
    }

    setUploading(false);

    const successCount = files.filter((f) => f.status === 'success').length;
    if (successCount > 0) {
      showToast('success', `${successCount} file(s) uploaded successfully`);
      setTimeout(() => router.push('/dashboard/files'), 1500);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return FileImage;
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text'))
      return FileText;
    return FileIcon;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t.upload}</h1>
        <p className="text-gray-400">
          {language === 'en'
            ? 'Upload files to your knowledge vault. Supported formats: PDF, DOC, TXT, Images, and more.'
            : 'अपनी vault में फ़ाइलें अपलोड करें। समर्थित प्रारूप: PDF, DOC, TXT, छवियाँ, और अधिक।'}
        </p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden
          border-2 border-dashed rounded-3xl p-12
          transition-all duration-300 cursor-pointer
          ${
            isDragActive
              ? 'border-vault-accent-blue bg-vault-accent-blue/10 scale-[1.02]'
              : 'border-vault-border-medium bg-white/3 hover:bg-white/5 hover:border-vault-border-strong'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vault-accent-blue/10 border border-vault-accent-blue/30 mb-4">
            <Upload className="w-8 h-8 text-vault-accent-blue" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{t.dragDropFiles}</h3>
          <p className="text-gray-400 mb-4">{t.orClickToSelect}</p>
          <p className="text-sm text-gray-500">
            Max file size: 50MB • Supported: PDF, DOC, DOCX, TXT, MD, Images, JSON, CSV
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="surface-elevated rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Files ({files.length})</h3>
            <button
              type="button"
              onClick={uploadFiles}
              disabled={uploading || files.every((f) => f.status !== 'pending')}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>{t.uploadProgress}</span>
                </>
              ) : (
                t.upload
              )}
            </button>
          </div>

          <div className="space-y-3">
            {files.map((uploadFile) => {
              const Icon = getFileIcon(uploadFile.file);
              return (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-vault-border-subtle"
                >
                  <div className="w-10 h-10 rounded-lg bg-vault-accent-blue/10 border border-vault-accent-blue/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-vault-accent-blue" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{uploadFile.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                      {uploadFile.status === 'uploading' && (
                        <p className="text-xs text-vault-accent-blue">{uploadFile.progress}%</p>
                      )}
                      {uploadFile.error && (
                        <p className="text-xs text-red-400">{uploadFile.error}</p>
                      )}
                    </div>
                    {uploadFile.status === 'uploading' && (
                      <div className="w-full bg-white/5 rounded-full h-1 mt-2">
                        <div
                          className="bg-vault-accent-blue h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {uploadFile.status === 'pending' && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    {uploadFile.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    {uploadFile.status === 'uploading' && (
                      <Loader className="w-5 h-5 text-vault-accent-blue animate-spin" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
