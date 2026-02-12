import { useState, useRef } from 'react';
import { adminAPI } from '../../services/api';
import { formatDatePT } from '../../utils/dateFormat';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  feedback_received: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
};

const statusLabels = {
  pending: 'Awaiting Review',
  feedback_received: 'Feedback Received',
  approved: 'Approved',
};

export default function ProofManager({ orderId, orderNumber, proofs, ccEmails = [], newCcEmail = '', setNewCcEmail, savingCc, onAddCcEmail, onRemoveCcEmail, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedProof, setExpandedProof] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('orderId', orderId);
      formData.append('title', title || `Proof ${new Date().toLocaleDateString()}`);
      formData.append('sendEmail', sendEmail);

      await adminAPI.uploadProof(formData);
      setSelectedFile(null);
      setTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUpdate();
    } catch (error) {
      console.error('Failed to upload proof:', error);
      alert('Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (proofId) => {
    if (!confirm('Delete this proof? This cannot be undone.')) return;

    try {
      await adminAPI.deleteProof(proofId);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete proof:', error);
      alert('Failed to delete proof');
    }
  };

  const handleResolveAnnotation = async (annotationId) => {
    try {
      await adminAPI.resolveAnnotation(annotationId);
      onUpdate();
    } catch (error) {
      console.error('Failed to resolve annotation:', error);
      alert('Failed to resolve annotation');
    }
  };

  const copyProofLink = (accessToken) => {
    const url = `${window.location.origin}/proof/${accessToken}`;
    navigator.clipboard.writeText(url);
    alert('Proof link copied to clipboard!');
  };

  const formatDate = (dateStr) => formatDatePT(dateStr);

  return (
    <div className="space-y-4">
      {/* CC Recipients Section */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            CC Recipients
          </label>
        </div>

        {/* Current CC Emails */}
        {ccEmails.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {ccEmails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700"
              >
                {email}
                <button
                  onClick={() => onRemoveCcEmail(email)}
                  disabled={savingCc}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add New CC Email */}
        <div className="flex gap-2">
          <input
            type="email"
            value={newCcEmail}
            onChange={(e) => setNewCcEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onAddCcEmail()}
            placeholder="Add CC email..."
            className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-academica-blue focus:border-academica-blue"
          />
          <button
            onClick={onAddCcEmail}
            disabled={savingCc || !newCcEmail.trim()}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
          >
            {savingCc ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-charcoal mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload New Proof
        </h4>

        <div className="space-y-3">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              {selectedFile ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {selectedFile.name}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Select file (image or PDF)
                </>
              )}
            </button>
          </div>

          {selectedFile && (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proof title (optional)"
                className="input w-full"
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700">Send email notification to customer</span>
              </label>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full btn bg-purple-600 hover:bg-purple-700 text-white py-2"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </span>
                ) : (
                  'Upload & Send Proof'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Proofs List */}
      {proofs && proofs.length > 0 ? (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <div key={proof.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Proof Header */}
              <div
                className="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => setExpandedProof(expandedProof === proof.id ? null : proof.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-charcoal flex items-center gap-2">
                      {proof.title || `Proof v${proof.version}`}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[proof.status]}`}>
                        {statusLabels[proof.status]}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Version {proof.version} - {formatDate(proof.createdAt)}
                      {proof.annotationCount > 0 && (
                        <span className="ml-2 text-orange-600">
                          {proof.annotationCount} annotation{proof.annotationCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedProof === proof.id ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded Content */}
              {expandedProof === proof.id && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  {/* Proof Preview */}
                  <div className="mb-3">
                    {proof.fileType?.startsWith('image/') ? (
                      <img
                        src={proof.fileUrl}
                        alt={proof.title}
                        className="max-h-48 rounded-lg border border-gray-200"
                      />
                    ) : (
                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View PDF
                      </a>
                    )}
                  </div>

                  {/* Signature Info */}
                  {proof.status === 'approved' && (
                    <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-green-800">
                        <strong>Approved by:</strong> {proof.signedOffBy}
                      </div>
                      <div className="text-xs text-green-600">
                        Signed: {formatDate(proof.signedOffAt)}
                      </div>
                      {proof.signature && (
                        <div className="mt-1 text-sm italic text-green-700">
                          Signature: "{proof.signature}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => copyProofLink(proof.accessToken)}
                      className="flex-1 btn btn-secondary py-1.5 text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </button>
                    <a
                      href={`/proof/${proof.accessToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn btn-secondary py-1.5 text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </a>
                    <button
                      onClick={() => handleDelete(proof.id)}
                      className="btn bg-red-50 text-red-600 hover:bg-red-100 py-1.5 px-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Annotations */}
                  {proof.annotations && proof.annotations.length > 0 && (
                    <div className="border-t border-gray-200 pt-3">
                      <h5 className="text-sm font-medium text-charcoal mb-2">Feedback ({proof.annotations.length})</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {proof.annotations.map((ann, idx) => (
                          <div
                            key={ann.id}
                            className={`p-2 rounded-lg border text-sm ${
                              ann.resolved
                                ? 'bg-gray-100 border-gray-200'
                                : 'bg-orange-50 border-orange-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                  ann.resolved ? 'bg-gray-400 text-white' : 'bg-orange-500 text-white'
                                }`}>
                                  {idx + 1}
                                </span>
                                <span className="font-medium text-charcoal">{ann.authorName}</span>
                              </div>
                              {!ann.resolved && (
                                <button
                                  onClick={() => handleResolveAnnotation(ann.id)}
                                  className="text-xs text-green-600 hover:underline"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                            <p className={`mt-1 ${ann.resolved ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                              {ann.comment}
                            </p>
                            <div className="text-xs text-gray-400 mt-1">
                              {ann.type === 'pin' ? 'Point' : 'Area'} annotation
                              {ann.resolved && ` - Resolved by ${ann.resolvedBy}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No proofs uploaded yet</p>
        </div>
      )}
    </div>
  );
}
