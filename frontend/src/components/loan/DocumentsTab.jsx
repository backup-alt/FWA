import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { CloudArrowUpIcon, DocumentIcon, TrashIcon, ArrowDownTrayIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/api';

export function DocumentsTab({ loanId, documents = [], onUpload, onDelete }) {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          showToast(`${file.name} is too large (max 5MB)`, 'error');
          continue;
        }

        const reader = new FileReader();
        const dataUri = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await onUpload({
          name: file.name,
          type: file.type,
          data: dataUri,
        });
      }
      showToast('Documents uploaded', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to upload document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (docId) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await onDelete(docId);
        showToast('Document deleted', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to delete document', 'error');
      }
    }
  };

  const isImage = (type) => type.startsWith('image/');

  return (
    <div className="space-y-6">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center">
          <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Images or PDFs (max 5MB)
          </p>
          <label>
            <Button as="span" loading={isUploading} disabled={isUploading}>
              Select Files
            </Button>
            <input 
              type="file" 
              className="hidden" 
              multiple 
              accept="image/*,application/pdf"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {documents.map((doc) => (
            <div key={doc._id} className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
              <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                {isImage(doc.type) ? (
                  <img src={doc.data} alt={doc.name} className="w-full h-full object-cover" />
                ) : (
                  <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a 
                    href={doc.data} 
                    download={doc.name}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </a>
                  <button 
                    onClick={() => handleDelete(doc._id)}
                    className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={doc.name}>
                  {doc.name}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
