import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, adminAPI } from '../services/api';
import UserDropdown from '../components/UserDropdown';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;

const SESSION_KEY = 'websiteRequestData';

const TOTAL_STEPS = 4;

// --- Sub-components ---

function ProgressDots({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div
            key={step}
            className={`rounded-full transition-all duration-300 ${
              isActive
                ? 'w-8 h-3 bg-academica-blue progress-dot-active'
                : isCompleted
                ? 'w-3 h-3 bg-academica-blue'
                : 'w-3 h-3 bg-gray-300'
            }`}
          />
        );
      })}
    </div>
  );
}

function ChatBubble({ children, delay = 0 }) {
  return (
    <div
      className="chat-bubble-appear flex items-start gap-3 mb-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0 w-10 h-10 bg-academica-blue rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 px-5 py-4 max-w-lg">
        <div className="text-charcoal">{children}</div>
      </div>
    </div>
  );
}

function NextButton({ onClick, disabled, label = 'Next' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn btn-primary px-8 py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-charcoal transition-colors mt-4"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentArea({ attachments, uploadingFiles, onFilesSelected, onRemove }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesSelected(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const totalCount = attachments.length + uploadingFiles.length;

  return (
    <div className="mt-4 chat-bubble-appear" style={{ animationDelay: '300ms' }}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Attachments <span className="text-gray-400 font-normal">(optional, max {MAX_FILES} files)</span>
      </label>

      {/* Drop zone */}
      {totalCount < MAX_FILES && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-academica-blue bg-academica-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-gray-500">
            Drag &amp; drop files here, or <span className="text-academica-blue font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Images, PDF, Word, Excel, PowerPoint — up to 250MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpeg,.jpg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            onChange={(e) => {
              onFilesSelected(Array.from(e.target.files));
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* File list */}
      {(attachments.length > 0 || uploadingFiles.length > 0) && (
        <ul className="mt-3 space-y-2">
          {/* Uploading files */}
          {uploadingFiles.map((file) => (
            <li key={file.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {file.error ? (
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              <span className={`truncate flex-1 ${file.error ? 'text-red-600' : 'text-gray-700'}`}>
                {file.name}
              </span>
              {file.error && <span className="text-xs text-red-500 flex-shrink-0">{file.error}</span>}
              <span className="text-gray-400 text-xs flex-shrink-0">{formatFileSize(file.size)}</span>
            </li>
          ))}
          {/* Uploaded files */}
          {attachments.map((att) => (
            <li key={att.filename} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="truncate flex-1 text-gray-700">{att.originalName}</span>
              <span className="text-gray-400 text-xs flex-shrink-0">{formatFileSize(att.size)}</span>
              <button
                type="button"
                onClick={() => onRemove(att.filename)}
                className="text-gray-400 hover:text-red-500 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GuestContactForm({ guestInfo, onChange, errors }) {
  return (
    <div className="space-y-4 chat-bubble-appear" style={{ animationDelay: '200ms' }}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
        <input
          type="text"
          value={guestInfo.contactName}
          onChange={(e) => onChange({ ...guestInfo, contactName: e.target.value })}
          className={`input ${errors?.contactName ? 'border-red-400 focus:ring-red-400' : ''}`}
          placeholder="Your full name"
        />
        {errors?.contactName && <p className="text-sm text-red-500 mt-1">{errors.contactName}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
        <input
          type="email"
          value={guestInfo.email}
          onChange={(e) => onChange({ ...guestInfo, email: e.target.value })}
          className={`input ${errors?.email ? 'border-red-400 focus:ring-red-400' : ''}`}
          placeholder="you@example.com"
        />
        {errors?.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
        <input
          type="tel"
          value={guestInfo.phone}
          onChange={(e) => onChange({ ...guestInfo, phone: e.target.value })}
          className="input"
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">School / Organization (optional)</label>
        <input
          type="text"
          value={guestInfo.schoolName}
          onChange={(e) => onChange({ ...guestInfo, schoolName: e.target.value })}
          className="input"
          placeholder="Your school or organization name"
        />
      </div>
    </div>
  );
}

function AuthenticatedSummary({ user }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 chat-bubble-appear" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-academica-blue-50 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-charcoal">{user.contactName}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          {user.schoolName && user.schoolName !== 'N/A' && (
            <p className="text-sm text-gray-500">{user.schoolName}</p>
          )}
        </div>
        <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function WebsiteRequest() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('forward');

  const [chatData, setChatData] = useState({
    websiteUrl: '',
    description: '',
  });

  const [guestInfo, setGuestInfo] = useState({
    contactName: '',
    email: '',
    phone: '',
    schoolName: '',
  });
  const [guestErrors, setGuestErrors] = useState({});

  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState('');

  // Admin on-behalf-of state
  const isAdmin = user?.userType === 'superadmin' || user?.role === 'admin';
  const [adminOrderMode, setAdminOrderMode] = useState('self');
  const [orderingAs, setOrderingAs] = useState('school_staff');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [onBehalfInfo, setOnBehalfInfo] = useState({ contactName: '', email: '', phone: '', schoolName: '' });

  // Restore session data on mount (from sign-in redirect flow)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.chatData) setChatData(parsed.chatData);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.attachments) setAttachments(parsed.attachments);
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const goToStep = useCallback((step, dir = 'forward') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setTimeout(() => {
      setCurrentStep(step);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1, 'forward');
    }
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1, 'back');
    }
  }, [currentStep, goToStep]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnimating || loading) return;

      // Step 2 (textarea): Cmd/Ctrl+Enter to advance
      if (currentStep === 2 && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (chatData.description.trim()) {
          goNext();
        }
        return;
      }

      // Enter to advance on step 1 (URL input uses its own handler)
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (currentStep === 3) goNext(); // skip from attachments step
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, chatData, isAnimating, loading, goNext]);

  const handleFilesSelected = async (files) => {
    const totalCount = attachments.length + uploadingFiles.length;
    const available = MAX_FILES - totalCount;
    if (available <= 0) return;

    const filesToUpload = files.slice(0, available);

    // Client-side validation
    const valid = [];
    const errors = [];
    for (const file of filesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push({ id: `err-${Date.now()}-${Math.random()}`, name: file.name, size: file.size, error: 'File exceeds 250MB' });
      } else if (!ALLOWED_EXTENSIONS.test(file.name)) {
        errors.push({ id: `err-${Date.now()}-${Math.random()}`, name: file.name, size: file.size, error: 'File type not allowed' });
      } else {
        valid.push(file);
      }
    }

    // Show errors briefly
    if (errors.length > 0) {
      setUploadingFiles(prev => [...prev, ...errors]);
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => !errors.some(e => e.id === f.id)));
      }, 3000);
    }

    if (valid.length === 0) return;

    // Add uploading placeholders
    const uploadIds = valid.map(() => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    const placeholders = valid.map((file, i) => ({
      id: uploadIds[i],
      name: file.name,
      size: file.size,
      error: null,
    }));
    setUploadingFiles(prev => [...prev, ...placeholders]);

    try {
      const response = await ordersAPI.uploadAttachments(valid);
      const uploaded = response.data.attachments;
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (err) {
      // Mark as failed
      setUploadingFiles(prev =>
        prev.map(f =>
          uploadIds.includes(f.id) ? { ...f, error: 'Upload failed' } : f
        )
      );
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => !uploadIds.includes(f.id)));
      }, 3000);
      return;
    }

    // Remove placeholders on success
    setUploadingFiles(prev => prev.filter(f => !uploadIds.includes(f.id)));
  };

  const handleRemoveAttachment = (filename) => {
    setAttachments(prev => prev.filter(a => a.filename !== filename));
  };

  const handleSignIn = () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      chatData,
      currentStep: TOTAL_STEPS,
      attachments,
    }));
    navigate(`/login?returnUrl=${encodeURIComponent('/website-request')}`);
  };

  const validateGuestInfo = () => {
    const errors = {};
    if (!guestInfo.contactName.trim()) errors.contactName = 'Name is required';
    if (!guestInfo.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) errors.email = 'Please enter a valid email';
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildRequestData = () => {
    const data = {
      requestType: 'custom',
      source: 'website-request',
      projectType: 'Website Change',
      projectTitle: `Website Request: ${chatData.websiteUrl}`,
      websiteUrl: chatData.websiteUrl,
      projectDescription: chatData.description,
    };

    if (attachments.length > 0) {
      data.attachments = attachments.map(a => ({
        filename: a.filename,
        originalName: a.originalName,
        size: a.size,
        type: a.type,
        url: a.url,
      }));
    }

    return data;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const customRequestData = buildRequestData();

      let response;
      if (isAuthenticated) {
        let submitShippingInfo;
        let onBehalfOfUserId = null;

        if (isAdmin && adminOrderMode === 'existing' && selectedUserId) {
          onBehalfOfUserId = selectedUserId;
          submitShippingInfo = {
            schoolName: selectedUserInfo?.schoolName || '',
            contactName: selectedUserInfo?.contactName || '',
            positionTitle: selectedUserInfo?.positionTitle || 'Website Request',
            principalName: selectedUserInfo?.principalName || 'N/A',
            email: selectedUserInfo?.email || '',
            phone: selectedUserInfo?.phone || '',
          };
        } else if (isAdmin && adminOrderMode === 'new') {
          if (!onBehalfInfo.contactName.trim()) {
            setError('Name is required when creating a new person');
            setLoading(false);
            return;
          }
          const createRes = await adminAPI.createQuickUser(onBehalfInfo);
          onBehalfOfUserId = createRes.data.user.id;
          submitShippingInfo = {
            schoolName: onBehalfInfo.schoolName || '',
            contactName: onBehalfInfo.contactName,
            email: onBehalfInfo.email || '',
            phone: onBehalfInfo.phone || '',
          };
        } else {
          submitShippingInfo = {
            schoolName: user?.schoolName || '',
            contactName: user?.contactName || '',
            positionTitle: user?.positionTitle || 'Website Request',
            principalName: user?.principalName || 'N/A',
            email: user?.email || '',
            phone: user?.phone || '',
          };
        }

        response = await ordersAPI.create({
          shippingInfo: submitShippingInfo,
          notes: null,
          isCustomRequest: true,
          customRequestData,
          onBehalfOfUserId,
        });
      } else {
        if (!validateGuestInfo()) {
          setLoading(false);
          return;
        }
        response = await ordersAPI.createGuest({
          guestInfo,
          customRequestData,
        });
      }

      setSubmittedOrderNumber(response.data.order?.orderNumber || '');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Success Screen ---
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-academica-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center chat-step-enter">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-charcoal mb-2">Request Submitted!</h2>
            {submittedOrderNumber && (
              <p className="text-sm text-gray-500 mb-4">Order #{submittedOrderNumber}</p>
            )}
            <p className="text-gray-600 mb-6">
              Thank you! Our Web Team will review your request and reach out within 1-2 business days.
            </p>
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <Link to="/orders" className="btn btn-primary py-3">
                  View My Requests
                </Link>
              ) : (
                <Link to="/" className="btn btn-primary py-3">
                  Back to Home
                </Link>
              )}
              <Link to="/products" className="text-sm text-academica-blue hover:underline">
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Step Content ---
  const renderStep = () => {
    switch (currentStep) {
      // Step 1: Website URL
      case 1:
        return (
          <div className="chat-step-enter" key="step-1">
            <ChatBubble>
              <p className="font-medium text-lg mb-1">Hi there! 👋</p>
              <p>Which website needs changes?</p>
              <p className="text-sm text-gray-500 mt-1">Paste the URL of the site you'd like updated.</p>
            </ChatBubble>
            <div className="ml-[52px]">
              <input
                type="url"
                value={chatData.websiteUrl}
                onChange={(e) => setChatData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                className="input chat-bubble-appear"
                style={{ animationDelay: '200ms' }}
                placeholder="https://www.example.com"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatData.websiteUrl.trim()) {
                    e.preventDefault();
                    goNext();
                  }
                }}
              />
              <NextButton onClick={goNext} disabled={!chatData.websiteUrl.trim()} />
            </div>
          </div>
        );

      // Step 2: Description
      case 2:
        return (
          <div className="chat-step-enter" key="step-2">
            <ChatBubble>
              <p>What changes or updates are needed?</p>
              <p className="text-sm text-gray-500 mt-1">The more detail, the better we can help.</p>
            </ChatBubble>
            <div className="ml-[52px]">
              <textarea
                value={chatData.description}
                onChange={(e) => setChatData(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
                className="input resize-none chat-bubble-appear"
                style={{ animationDelay: '200ms' }}
                placeholder="Describe what changes you need... (e.g., Update the staff directory page with new headshots and titles, fix the broken contact form on the About page)"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">
                Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to continue
              </p>
              <NextButton onClick={goNext} disabled={!chatData.description.trim()} />
              <BackButton onClick={goBack} />
            </div>
          </div>
        );

      // Step 3: File Attachments
      case 3:
        return (
          <div className="chat-step-enter" key="step-3">
            <ChatBubble>
              <p>Have any screenshots, mockups, or documents to share?</p>
              <p className="text-sm text-gray-500 mt-1">This is optional — skip ahead if you don't have any files.</p>
            </ChatBubble>
            <div className="ml-[52px]">
              <AttachmentArea
                attachments={attachments}
                uploadingFiles={uploadingFiles}
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemoveAttachment}
              />
              <NextButton onClick={goNext} disabled={uploadingFiles.length > 0} label={attachments.length > 0 ? 'Next' : 'Skip'} />
              <BackButton onClick={goBack} />
            </div>
          </div>
        );

      // Step 4: Contact & Submit
      case 4:
        return (
          <div className="chat-step-enter" key="step-4">
            <ChatBubble>
              <p>Almost done! Let's review and submit your request.</p>
            </ChatBubble>

            <div className="ml-[52px] space-y-6">
              {/* Summary of selections */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 chat-bubble-appear" style={{ animationDelay: '100ms' }}>
                <p className="font-medium text-charcoal">Request Summary</p>
                <div className="flex gap-2">
                  <span className="text-gray-500">Website:</span>
                  <span className="text-charcoal break-all">{chatData.websiteUrl}</span>
                </div>
                <div>
                  <span className="text-gray-500">Changes Needed:</span>
                  <p className="text-charcoal mt-1 line-clamp-3">{chatData.description}</p>
                </div>
                {attachments.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Attachments:</span>
                    <span className="text-charcoal">{attachments.length} file{attachments.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Auth state */}
              {isAuthenticated ? (
                <>
                  {/* Admin on-behalf-of panel */}
                  {isAdmin ? (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200 chat-bubble-appear" style={{ animationDelay: '200ms' }}>
                      <div className="text-sm font-medium text-blue-800">Admin Order Options</div>

                      {/* 3-mode radio group */}
                      <div className="flex flex-col gap-2">
                        {[
                          { value: 'self', label: 'Submit under my account', desc: 'Order linked to your account' },
                          { value: 'existing', label: 'Submit for existing user', desc: 'Search and select a user' },
                          { value: 'new', label: 'Submit for new person', desc: 'Create a new user on the fly' },
                        ].map(opt => (
                          <label
                            key={opt.value}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                              adminOrderMode === opt.value
                                ? 'border-academica-blue bg-white'
                                : 'border-transparent hover:bg-blue-100/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="adminOrderMode"
                              value={opt.value}
                              checked={adminOrderMode === opt.value}
                              onChange={() => {
                                setAdminOrderMode(opt.value);
                                setOrderingAs('school_staff');
                                setSelectedUserId(null);
                                setSelectedUserInfo(null);
                                setOnBehalfInfo({ contactName: '', email: '', phone: '', schoolName: '' });
                              }}
                              className="mt-0.5"
                            />
                            <div>
                              <div className="font-medium text-charcoal text-sm">{opt.label}</div>
                              <div className="text-xs text-gray-500">{opt.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* User type toggle (for existing/new modes) */}
                      {adminOrderMode !== 'self' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                          <select
                            value={orderingAs}
                            onChange={(e) => {
                              setOrderingAs(e.target.value);
                              setSelectedUserId(null);
                              setSelectedUserInfo(null);
                            }}
                            className="input"
                          >
                            <option value="school_staff">School Staff Member</option>
                            <option value="academica_employee">Academica Employee (Internal)</option>
                          </select>
                        </div>
                      )}

                      {/* Self mode - show current user summary */}
                      {adminOrderMode === 'self' && (
                        <AuthenticatedSummary user={user} />
                      )}

                      {/* Existing user search */}
                      {adminOrderMode === 'existing' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search & Select User
                          </label>
                          <UserDropdown
                            value={selectedUserId}
                            onChange={(userId, userObj) => {
                              setSelectedUserId(userId);
                              setSelectedUserInfo(userObj);
                            }}
                            onClear={() => {
                              setSelectedUserId(null);
                              setSelectedUserInfo(null);
                            }}
                            onCreateNew={() => {
                              setAdminOrderMode('new');
                              setSelectedUserId(null);
                              setSelectedUserInfo(null);
                            }}
                            userTypeFilter={orderingAs}
                          />
                          {selectedUserInfo && (
                            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Selected: {selectedUserInfo.contactName} ({selectedUserInfo.email})
                            </div>
                          )}
                        </div>
                      )}

                      {/* New person quick-create fields */}
                      {adminOrderMode === 'new' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                              type="text"
                              value={onBehalfInfo.contactName}
                              onChange={(e) => setOnBehalfInfo(prev => ({ ...prev, contactName: e.target.value }))}
                              className="input"
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                            <input
                              type="email"
                              value={onBehalfInfo.email}
                              onChange={(e) => setOnBehalfInfo(prev => ({ ...prev, email: e.target.value }))}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                            <input
                              type="tel"
                              value={onBehalfInfo.phone}
                              onChange={(e) => setOnBehalfInfo(prev => ({ ...prev, phone: e.target.value }))}
                              className="input"
                              placeholder="(555) 123-4567"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School (optional)</label>
                            <input
                              type="text"
                              value={onBehalfInfo.schoolName}
                              onChange={(e) => setOnBehalfInfo(prev => ({ ...prev, schoolName: e.target.value }))}
                              className="input"
                              placeholder="School name"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <AuthenticatedSummary user={user} />
                  )}

                  {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error}</div>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-primary px-8 py-3 w-full sm:w-auto"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </>
              ) : (
                <>
                  {!guestMode ? (
                    <div className="chat-bubble-appear flex flex-col sm:flex-row gap-3" style={{ animationDelay: '300ms' }}>
                      <button
                        type="button"
                        onClick={handleSignIn}
                        className="btn btn-primary px-8 py-3 flex-1"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuestMode(true)}
                        className="btn btn-secondary px-8 py-3 flex-1"
                      >
                        Continue as Guest
                      </button>
                    </div>
                  ) : (
                    <>
                      <GuestContactForm
                        guestInfo={guestInfo}
                        onChange={setGuestInfo}
                        errors={guestErrors}
                      />
                      {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error}</div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={loading}
                          className="btn btn-primary px-8 py-3"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Submitting...
                            </span>
                          ) : (
                            'Submit Request'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setGuestMode(false); setGuestErrors({}); }}
                          className="text-sm text-gray-500 hover:text-charcoal"
                        >
                          Back to sign in option
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              <BackButton onClick={goBack} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-academica-blue-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-charcoal">Website Request</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tell us what website changes you need in just a few steps
          </p>
        </div>

        <ProgressDots currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Step Content */}
        <div className="min-h-[400px]">
          {!isAnimating && renderStep()}
        </div>

        {/* Footer link to full form */}
        <div className="text-center mt-12 text-sm text-gray-400">
          Need something else?{' '}
          <Link to="/quick-request" className="text-academica-blue hover:underline">
            Submit a Quick Request
          </Link>
        </div>
      </div>
    </div>
  );
}
