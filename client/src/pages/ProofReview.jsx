import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { proofsAPI } from '../services/api';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const TOOL_PIN = 'pin';
const TOOL_RECT = 'rect';

export default function ProofReview() {
  const { accessToken } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proof, setProof] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);
  const [canAnnotate, setCanAnnotate] = useState(false);
  const [canSignOff, setCanSignOff] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Annotation state
  const [activeTool, setActiveTool] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [pendingAnnotation, setPendingAnnotation] = useState(null);
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [submittingAnnotation, setSubmittingAnnotation] = useState(false);

  // Rectangle drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);

  // Sign-off state
  const [showSignOff, setShowSignOff] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [submittingSignOff, setSubmittingSignOff] = useState(false);

  // Feedback submitted confirmation
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Image container ref for calculating positions
  const imageContainerRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // PDF state
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(800);

  // Load proof data
  useEffect(() => {
    loadProof();
  }, [accessToken]);

  const loadProof = async () => {
    try {
      setLoading(true);
      const response = await proofsAPI.getByToken(accessToken);
      setProof(response.data.proof);
      setAnnotations(response.data.proof.annotations || []);
      setVersionHistory(response.data.versionHistory || []);
      setCanAnnotate(response.data.canAnnotate);
      setCanSignOff(response.data.canSignOff);
      setIsExpired(response.data.isExpired);

      // Pre-fill author info from shipping info if available
      if (response.data.proof.shippingInfo) {
        setAuthorName(response.data.proof.shippingInfo.contactName || '');
        setAuthorEmail(response.data.proof.shippingInfo.email || '');
        setSignatureName(response.data.proof.shippingInfo.contactName || '');
      }
    } catch (err) {
      console.error('Failed to load proof:', err);
      setError(err.response?.data?.error || 'Failed to load proof');
    } finally {
      setLoading(false);
    }
  };

  // Handle image load to get dimensions
  const handleImageLoad = (e) => {
    setImageSize({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    });
  };

  // Handle PDF load
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  // Check if file is PDF
  const isPdf = proof?.fileType === 'application/pdf';

  // Get annotations for current page (for PDFs, we store page in annotation)
  const getAnnotationsForCurrentView = () => {
    if (!isPdf) return annotations;
    return annotations.filter(ann => (ann.page || 1) === currentPage);
  };

  // Get click position relative to image (as percentage)
  const getRelativePosition = useCallback((e) => {
    if (!imageContainerRef.current) return null;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  // Handle click on image
  const handleImageClick = useCallback((e) => {
    if (!canAnnotate || !activeTool) return;
    if (activeTool === TOOL_RECT) return; // Rectangles use drag

    const pos = getRelativePosition(e);
    if (!pos) return;

    setPendingAnnotation({
      type: TOOL_PIN,
      x: pos.x,
      y: pos.y,
      page: isPdf ? currentPage : undefined
    });
  }, [canAnnotate, activeTool, getRelativePosition, isPdf, currentPage]);

  // Handle mouse down for rectangle drawing
  const handleMouseDown = useCallback((e) => {
    if (!canAnnotate || activeTool !== TOOL_RECT) return;

    const pos = getRelativePosition(e);
    if (!pos) return;

    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  }, [canAnnotate, activeTool, getRelativePosition]);

  // Handle mouse move for rectangle drawing
  const handleMouseMove = useCallback((e) => {
    if (!isDrawing) return;

    const pos = getRelativePosition(e);
    if (!pos) return;

    setDrawCurrent(pos);
  }, [isDrawing, getRelativePosition]);

  // Handle mouse up for rectangle drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawStart || !drawCurrent) {
      setIsDrawing(false);
      return;
    }

    // Calculate rectangle bounds
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    // Only create annotation if rectangle is big enough
    if (width > 2 && height > 2) {
      setPendingAnnotation({
        type: TOOL_RECT,
        x,
        y,
        width,
        height,
        page: isPdf ? currentPage : undefined
      });
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [isDrawing, drawStart, drawCurrent]);

  // Submit annotation
  const handleSubmitAnnotation = async () => {
    if (!pendingAnnotation || !comment.trim() || !authorName.trim()) return;

    setSubmittingAnnotation(true);
    try {
      const response = await proofsAPI.addAnnotation(accessToken, {
        ...pendingAnnotation,
        comment: comment.trim(),
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined
      });

      setAnnotations([...annotations, response.data.annotation]);
      setPendingAnnotation(null);
      setComment('');
      setActiveTool(null);
    } catch (err) {
      console.error('Failed to add annotation:', err);
      alert(err.response?.data?.error || 'Failed to add annotation');
    } finally {
      setSubmittingAnnotation(false);
    }
  };

  // Cancel pending annotation
  const cancelAnnotation = () => {
    setPendingAnnotation(null);
    setComment('');
  };

  // Delete annotation
  const handleDeleteAnnotation = async (annotationId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await proofsAPI.deleteAnnotation(accessToken, annotationId);
      setAnnotations(annotations.filter(ann => ann.id !== annotationId));
    } catch (err) {
      console.error('Failed to delete annotation:', err);
      alert(err.response?.data?.error || 'Failed to delete annotation');
    }
  };

  // Submit sign-off
  const handleSignOff = async () => {
    if (!signatureName.trim() || !signatureText.trim()) return;

    setSubmittingSignOff(true);
    try {
      await proofsAPI.signOff(accessToken, {
        signedOffBy: signatureName.trim(),
        signature: signatureText.trim(),
        signatureType: 'typed'
      });

      // Reload to get updated status
      await loadProof();
      setShowSignOff(false);
    } catch (err) {
      console.error('Failed to sign off:', err);
      alert(err.response?.data?.error || 'Failed to approve proof');
    } finally {
      setSubmittingSignOff(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proof...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Proof</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Proof Review</h1>
              <p className="text-sm text-gray-500">
                Order #{proof.orderNumber} - {proof.title || `Version ${proof.version}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {proof.status === 'approved' ? (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approved
                </span>
              ) : isExpired ? (
                <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-medium">
                  Link Expired
                </span>
              ) : (
                <>
                  {annotations.length > 0 && (
                    <button
                      onClick={() => setFeedbackSubmitted(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Feedback
                    </button>
                  )}
                  <button
                    onClick={() => setShowSignOff(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve Proof
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Proof Area */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            {canAnnotate && (
              <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Annotation Tools:</span>
                <button
                  onClick={() => setActiveTool(activeTool === TOOL_PIN ? null : TOOL_PIN)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTool === TOOL_PIN
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Pin
                </button>
                <button
                  onClick={() => setActiveTool(activeTool === TOOL_RECT ? null : TOOL_RECT)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTool === TOOL_RECT
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Rectangle
                </button>
                {activeTool && (
                  <span className="text-sm text-purple-600 ml-2">
                    {activeTool === TOOL_PIN ? 'Click on the image to add a pin' : 'Click and drag to draw a rectangle'}
                  </span>
                )}
              </div>
            )}

            {/* PDF Page Navigation */}
            {isPdf && numPages && (
              <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {numPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage >= numPages}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <a
                  href={proof.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 text-sm text-purple-600 hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open PDF
                </a>
              </div>
            )}

            {/* Proof Image with Annotations */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div
                ref={imageContainerRef}
                className={`relative ${activeTool ? 'cursor-crosshair' : ''}`}
                onClick={handleImageClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {isPdf ? (
                  <Document
                    file={proof.fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading PDF...</p>
                      </div>
                    }
                    error={
                      <div className="p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-gray-600 mb-4">Failed to load PDF</p>
                        <a
                          href={proof.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          Open PDF in new tab
                        </a>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={currentPage}
                      width={pdfWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                ) : (
                  <img
                    src={proof.fileUrl}
                    alt={proof.title}
                    onLoad={handleImageLoad}
                    className="w-full h-auto"
                    draggable={false}
                  />
                )}

                {/* Existing Annotations */}
                {getAnnotationsForCurrentView().map((ann) => {
                  const globalIndex = annotations.findIndex(a => a.id === ann.id) + 1;
                  return (
                    <div key={ann.id}>
                      {ann.type === 'pin' ? (
                        <div
                          className={`absolute transform -translate-x-1/2 -translate-y-full ${
                            ann.resolved ? 'opacity-50' : ''
                          }`}
                          style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            ann.resolved ? 'bg-gray-400' : 'bg-orange-500'
                          }`}>
                            {globalIndex}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`absolute border-2 ${
                            ann.resolved ? 'border-gray-400 bg-gray-400/10' : 'border-orange-500 bg-orange-500/10'
                          }`}
                          style={{
                            left: `${ann.x}%`,
                            top: `${ann.y}%`,
                            width: `${ann.width}%`,
                            height: `${ann.height}%`
                          }}
                        >
                          <span className={`absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            ann.resolved ? 'bg-gray-400' : 'bg-orange-500'
                          }`}>
                            {globalIndex}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pending Annotation */}
                {pendingAnnotation && (
                  pendingAnnotation.type === 'pin' ? (
                    <div
                      className="absolute transform -translate-x-1/2 -translate-y-full"
                      style={{ left: `${pendingAnnotation.x}%`, top: `${pendingAnnotation.y}%` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center animate-pulse">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="absolute border-2 border-purple-600 bg-purple-600/10"
                      style={{
                        left: `${pendingAnnotation.x}%`,
                        top: `${pendingAnnotation.y}%`,
                        width: `${pendingAnnotation.width}%`,
                        height: `${pendingAnnotation.height}%`
                      }}
                    />
                  )
                )}

                {/* Drawing Rectangle Preview */}
                {isDrawing && drawStart && drawCurrent && (
                  <div
                    className="absolute border-2 border-purple-600 border-dashed bg-purple-600/10"
                    style={{
                      left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
                      top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
                      width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
                      height: `${Math.abs(drawCurrent.y - drawStart.y)}%`
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Comment Form for Pending Annotation */}
            {pendingAnnotation && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Add Your Feedback</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="john@school.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comment *</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe the change needed..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitAnnotation}
                      disabled={submittingAnnotation || !comment.trim() || !authorName.trim()}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      {submittingAnnotation ? 'Submitting...' : 'Submit'}
                    </button>
                    <button
                      onClick={cancelAnnotation}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Annotations List */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Feedback ({annotations.length})
              </h3>
              {annotations.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {annotations.map((ann, idx) => (
                    <div
                      key={ann.id}
                      className={`p-3 rounded-lg border ${
                        ann.resolved
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${
                          ann.resolved ? 'bg-gray-400' : 'bg-orange-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900">{ann.authorName}</div>
                            {canAnnotate && !ann.resolved && (
                              <button
                                onClick={() => handleDeleteAnnotation(ann.id)}
                                className="text-gray-400 hover:text-red-500 p-1"
                                title="Delete feedback"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${ann.resolved ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                            {ann.comment}
                          </p>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(ann.createdAt)}
                            {isPdf && ann.page && (
                              <span className="ml-2 text-purple-600">Page {ann.page}</span>
                            )}
                            {!!ann.resolved && (
                              <span className="ml-2 text-green-600">Resolved</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No feedback yet. Use the tools above to add annotations.</p>
              )}
            </div>

            {/* Version History */}
            {versionHistory.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Version History</h3>
                <div className="space-y-2">
                  {versionHistory.map((v) => (
                    <a
                      key={v.id}
                      href={`/proof/${v.accessToken}`}
                      className={`block p-2 rounded-lg border transition-colors ${
                        v.id === proof.id
                          ? 'bg-purple-50 border-purple-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        Version {v.version}
                        {v.id === proof.id && (
                          <span className="ml-2 text-purple-600">(Current)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(v.createdAt)}
                        {v.status === 'approved' && (
                          <span className="ml-2 text-green-600">Approved</span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Info */}
            {proof.status === 'approved' && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Proof Approved
                </div>
                <p className="text-sm text-green-700">
                  Approved by: {proof.signedOffBy}
                </p>
                <p className="text-sm text-green-700">
                  Date: {formatDate(proof.signedOffAt)}
                </p>
                {proof.signature && (
                  <p className="text-sm text-green-700 italic mt-2">
                    Signature: "{proof.signature}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sign-Off Modal */}
      {showSignOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Proof</h2>
            <p className="text-gray-600 mb-6">
              By approving this proof, you confirm that the design is ready for production.
              This action cannot be undone.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type your signature *
                </label>
                <input
                  type="text"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl italic"
                  style={{ fontFamily: 'cursive, serif' }}
                  placeholder="Your signature"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will serve as your digital signature
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Once approved, this proof will be sent to production and no further changes can be made.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSignOff(false)}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOff}
                disabled={submittingSignOff || !signatureName.trim() || !signatureText.trim()}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingSignOff ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve & Sign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Sent Modal */}
      {feedbackSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Feedback Sent!</h2>
            <p className="text-gray-600 mb-6">
              Your feedback has been sent to the design team. It's now safe to close this window, or you can continue adding more feedback.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setFeedbackSubmitted(false)}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add More Feedback
              </button>
              <button
                onClick={() => window.close()}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
