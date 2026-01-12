import { useState } from 'react';

export default function CommunicationFeed({ communications, loading }) {
  const [previewImage, setPreviewImage] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImageFile = (type) => {
    return type && type.startsWith('image/');
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (type?.includes('word') || type?.includes('doc')) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-academica-blue"></div>
      </div>
    );
  }

  if (!communications || communications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p>No email communications yet</p>
        <p className="text-sm mt-1">Send an email to start the conversation</p>
      </div>
    );
  }

  // Sort communications with newest first
  const sortedCommunications = [...communications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <>
      <div className="space-y-4">
        {sortedCommunications.map((comm) => (
          <div
            key={comm.id}
            className={`rounded-lg p-4 ${
              comm.direction === 'outbound'
                ? 'bg-blue-50 border border-blue-200 ml-4'
                : 'bg-gray-50 border border-gray-200 mr-4'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {comm.direction === 'outbound' ? (
                  <>
                    <div className="w-8 h-8 bg-academica-blue rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-charcoal">{comm.adminName || 'Admin'}</span>
                      <span className="text-gray-500 text-sm ml-2">to {comm.recipientEmail}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-charcoal">Customer</span>
                      <span className="text-gray-500 text-sm ml-2">{comm.senderEmail}</span>
                    </div>
                  </>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(comm.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Subject */}
            <div className="font-medium text-charcoal mb-2">{comm.subject}</div>

            {/* Body */}
            <div className="text-gray-700 text-sm whitespace-pre-wrap">{comm.body}</div>

            {/* Attachments */}
            {comm.attachments && comm.attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
                  Attachments ({comm.attachments.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {comm.attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 text-sm"
                    >
                      {isImageFile(att.type) ? (
                        <button
                          onClick={() => setPreviewImage(att.path)}
                          className="w-10 h-10 rounded overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={att.path}
                            alt={att.filename}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        getFileIcon(att.type)
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-charcoal max-w-24" title={att.filename}>
                          {att.filename}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatFileSize(att.size)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isImageFile(att.type) && (
                          <button
                            onClick={() => setPreviewImage(att.path)}
                            className="p-1 text-gray-400 hover:text-academica-blue"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        <a
                          href={att.path}
                          download={att.filename}
                          className="p-1 text-gray-400 hover:text-academica-blue"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-2 text-center">
              <a
                href={previewImage}
                download
                className="inline-flex items-center gap-2 text-white hover:text-gray-300"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
