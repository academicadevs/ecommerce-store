import { useEffect } from 'react';

const IMAGE_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/i;
const PDF_TYPE = /^application\/pdf$/i;

function getTypeFromName(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return map[ext] || 'application/octet-stream';
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FILE_ICONS = {
  pdf: { color: 'text-red-500', label: 'PDF' },
  doc: { color: 'text-blue-600', label: 'Word' },
  docx: { color: 'text-blue-600', label: 'Word' },
  xls: { color: 'text-green-600', label: 'Excel' },
  xlsx: { color: 'text-green-600', label: 'Excel' },
  ppt: { color: 'text-orange-500', label: 'PowerPoint' },
  pptx: { color: 'text-orange-500', label: 'PowerPoint' },
};

export default function FilePreviewModal({ file, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  if (!file) return null;

  const mimeType = file.type || getTypeFromName(file.originalName || file.filename);
  const isImage = IMAGE_TYPES.test(mimeType);
  const isPdf = PDF_TYPE.test(mimeType);
  const ext = (file.originalName || file.filename)?.split('.').pop()?.toLowerCase();
  const fileInfo = FILE_ICONS[ext];

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm text-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span className="truncate font-medium">{file.originalName || file.filename}</span>
          {file.size > 0 && (
            <span className="text-gray-400 text-sm flex-shrink-0">{formatFileSize(file.size)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={file.url}
            download={file.originalName || file.filename}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="relative z-10 flex-1 flex items-center justify-center overflow-auto p-4">
        {isImage && (
          <img
            src={file.url}
            alt={file.originalName || 'Preview'}
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
          />
        )}

        {isPdf && (
          <iframe
            src={file.url}
            title={file.originalName || 'PDF Preview'}
            className="w-full h-full max-w-4xl rounded shadow-2xl bg-white"
          />
        )}

        {!isImage && !isPdf && (
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md">
            <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-gray-100 ${fileInfo?.color || 'text-gray-400'}`}>
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-1">{file.originalName || file.filename}</h3>
            <p className="text-gray-500 text-sm mb-1">
              {fileInfo?.label || ext?.toUpperCase() || 'Document'} file
              {file.size > 0 && ` — ${formatFileSize(file.size)}`}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              This file type can't be previewed in the browser.
            </p>
            <a
              href={file.url}
              download={file.originalName || file.filename}
              className="btn btn-primary px-6 py-2.5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
