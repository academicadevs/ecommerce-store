import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, adminAPI } from '../services/api';
import UserDropdown from '../components/UserDropdown';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;

const SESSION_KEY = 'quickRequestData';

const projectTypes = [
  { value: 'custom-design', label: 'Custom Design', icon: '🎨', description: 'Something designed from scratch' },
  { value: 'modification', label: 'Modify Existing', icon: '✏️', description: 'Update or revise existing designs' },
  { value: 'rush-order', label: 'Rush Order', icon: '⚡', description: 'Time-sensitive, tight deadline' },
  { value: 'bulk-order', label: 'Bulk Order', icon: '📦', description: 'High-volume, special coordination' },
  { value: 'event-materials', label: 'Event Materials', icon: '🎪', description: 'Comprehensive event package' },
  { value: 'branding', label: 'Branding', icon: '🏫', description: 'Logos, identity, brand work' },
  { value: 'other', label: 'Other', icon: '💬', description: 'Something not listed above' },
];

const materialOptions = [
  { value: 'print', label: 'Print' },
  { value: 'signage', label: 'Signage' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'digital', label: 'Digital' },
  { value: 'tradeshow', label: 'Trade Show' },
  { value: 'not-sure', label: 'Not Sure' },
];

const timelineOptions = [
  { value: 'urgent', label: 'Urgent', sublabel: 'Within 1 week', icon: '🔥' },
  { value: 'soon', label: '2-3 Weeks', sublabel: 'Standard turnaround', icon: '📅' },
  { value: 'standard', label: '4-6 Weeks', sublabel: 'Comfortable timeline', icon: '🗓️' },
  { value: 'flexible', label: 'Flexible', sublabel: 'No rush at all', icon: '🌊' },
];

const TOTAL_STEPS = 5;

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

function OptionCard({ icon, label, description, selected, onClick, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`option-card-appear text-left w-full p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
        selected
          ? 'border-academica-blue bg-academica-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`font-medium ${selected ? 'text-academica-blue' : 'text-charcoal'}`}>{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        {selected && (
          <svg className="w-5 h-5 text-academica-blue ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
}

function ChipButton({ label, selected, onClick, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`option-card-appear px-5 py-2.5 rounded-full border-2 font-medium text-sm transition-all duration-200 ${
        selected
          ? 'border-academica-blue bg-academica-blue text-white'
          : 'border-gray-300 bg-white text-charcoal hover:border-gray-400'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {label}
    </button>
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

export default function QuickRequest() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('forward');

  const [chatData, setChatData] = useState({
    projectType: '',
    materials: [],
    description: '',
    timeline: '',
    eventDate: '',
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
  const [adminOrderMode, setAdminOrderMode] = useState('self'); // 'self' | 'existing' | 'new'
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

      // Step 3 (textarea): Cmd/Ctrl+Enter to advance
      if (currentStep === 3 && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (chatData.description.trim()) {
          goNext();
        }
        return;
      }

      // Enter to advance (except on textarea steps)
      if (e.key === 'Enter' && currentStep !== 3 && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (currentStep === 1 && chatData.projectType) goNext();
        if (currentStep === 2 && chatData.materials.length > 0) goNext();
        if (currentStep === 4 && chatData.timeline) goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, chatData, isAnimating, loading, goNext]);

  const handleProjectTypeSelect = (value) => {
    setChatData(prev => ({ ...prev, projectType: value }));
    // Auto-advance after brief delay
    setTimeout(() => goNext(), 400);
  };

  const handleMaterialToggle = (value) => {
    setChatData(prev => ({
      ...prev,
      materials: prev.materials.includes(value)
        ? prev.materials.filter(m => m !== value)
        : [...prev.materials, value]
    }));
  };

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
    // Save current chat data to sessionStorage (include attachments)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      chatData,
      currentStep: TOTAL_STEPS, // Return to final step
      attachments,
    }));
    navigate(`/login?returnUrl=${encodeURIComponent('/quick-request')}`);
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
    const projectLabel = projectTypes.find(p => p.value === chatData.projectType)?.label || chatData.projectType;
    const materialLabels = chatData.materials.map(m => materialOptions.find(o => o.value === m)?.label || m);
    const timelineLabel = timelineOptions.find(t => t.value === chatData.timeline)?.label || chatData.timeline;

    const data = {
      requestType: 'custom',
      source: 'quick-request',
      projectType: projectLabel,
      projectTitle: `Quick Request: ${projectLabel}`,
      timeline: timelineLabel,
      eventDate: chatData.eventDate || null,
      materialTypes: materialLabels,
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
            positionTitle: selectedUserInfo?.positionTitle || 'Quick Request',
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
          // Self or non-admin
          submitShippingInfo = {
            schoolName: user?.schoolName || '',
            contactName: user?.contactName || '',
            positionTitle: user?.positionTitle || 'Quick Request',
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
              Thank you! Our Design Department will review your request and reach out within 1-2 business days.
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
      // Step 1: Project Type
      case 1:
        return (
          <div className="chat-step-enter" key="step-1">
            <ChatBubble>
              <p className="font-medium text-lg mb-1">Hi there! 👋</p>
              <p>What type of project are you looking for?</p>
            </ChatBubble>
            <div className="grid gap-3 sm:grid-cols-2 ml-[52px]">
              {projectTypes.map((type, i) => (
                <OptionCard
                  key={type.value}
                  icon={type.icon}
                  label={type.label}
                  description={type.description}
                  selected={chatData.projectType === type.value}
                  onClick={() => handleProjectTypeSelect(type.value)}
                  delay={100 + i * 60}
                />
              ))}
            </div>
          </div>
        );

      // Step 2: Materials
      case 2:
        return (
          <div className="chat-step-enter" key="step-2">
            <ChatBubble>
              <p>Great choice! What types of materials do you need?</p>
              <p className="text-sm text-gray-500 mt-1">Select all that apply.</p>
            </ChatBubble>
            <div className="flex flex-wrap gap-3 ml-[52px]">
              {materialOptions.map((opt, i) => (
                <ChipButton
                  key={opt.value}
                  label={opt.label}
                  selected={chatData.materials.includes(opt.value)}
                  onClick={() => handleMaterialToggle(opt.value)}
                  delay={100 + i * 60}
                />
              ))}
            </div>
            <div className="ml-[52px]">
              <NextButton onClick={goNext} disabled={chatData.materials.length === 0} />
            </div>
            <div className="ml-[52px]">
              <BackButton onClick={goBack} />
            </div>
          </div>
        );

      // Step 3: Description + Attachments
      case 3:
        return (
          <div className="chat-step-enter" key="step-3">
            <ChatBubble>
              <p>Tell us about your project!</p>
              <p className="text-sm text-gray-500 mt-1">The more detail, the better we can help.</p>
            </ChatBubble>
            <div className="ml-[52px]">
              <textarea
                value={chatData.description}
                onChange={(e) => setChatData(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
                className="input resize-none chat-bubble-appear"
                style={{ animationDelay: '200ms' }}
                placeholder="Describe what you're looking for... (e.g., We need new enrollment flyers for our spring campaign, featuring our updated logo and campus photos)"
                autoFocus
              />
              <AttachmentArea
                attachments={attachments}
                uploadingFiles={uploadingFiles}
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemoveAttachment}
              />
              <p className="text-xs text-gray-400 mt-2">
                Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to continue
              </p>
              <NextButton onClick={goNext} disabled={!chatData.description.trim() || uploadingFiles.length > 0} />
              <BackButton onClick={goBack} />
            </div>
          </div>
        );

      // Step 4: Timeline
      case 4:
        return (
          <div className="chat-step-enter" key="step-4">
            <ChatBubble>
              <p>When do you need this completed?</p>
            </ChatBubble>
            <div className="grid gap-3 sm:grid-cols-2 ml-[52px]">
              {timelineOptions.map((opt, i) => (
                <OptionCard
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.sublabel}
                  selected={chatData.timeline === opt.value}
                  onClick={() => {
                    setChatData(prev => ({ ...prev, timeline: opt.value }));
                    setTimeout(() => goNext(), 400);
                  }}
                  delay={100 + i * 60}
                />
              ))}
            </div>
            <div className="ml-[52px] mt-4 chat-bubble-appear" style={{ animationDelay: '400ms' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event or due date? (optional)</label>
              <input
                type="date"
                value={chatData.eventDate}
                onChange={(e) => setChatData(prev => ({ ...prev, eventDate: e.target.value }))}
                className="input max-w-xs"
              />
            </div>
            {chatData.timeline && (
              <div className="ml-[52px]">
                <NextButton onClick={goNext} disabled={false} />
              </div>
            )}
            <div className="ml-[52px]">
              <BackButton onClick={goBack} />
            </div>
          </div>
        );

      // Step 5: Contact & Submit
      case 5:
        return (
          <div className="chat-step-enter" key="step-5">
            <ChatBubble>
              <p>Almost done! Let's get your contact info and submit.</p>
            </ChatBubble>

            <div className="ml-[52px] space-y-6">
              {/* Summary of selections */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 chat-bubble-appear" style={{ animationDelay: '100ms' }}>
                <p className="font-medium text-charcoal">Request Summary</p>
                <div className="flex gap-2">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-charcoal">{projectTypes.find(p => p.value === chatData.projectType)?.label}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500">Materials:</span>
                  <span className="text-charcoal">
                    {chatData.materials.map(m => materialOptions.find(o => o.value === m)?.label).join(', ')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500">Timeline:</span>
                  <span className="text-charcoal">{timelineOptions.find(t => t.value === chatData.timeline)?.label}</span>
                </div>
                {chatData.eventDate && (
                  <div className="flex gap-2">
                    <span className="text-gray-500">Event Date:</span>
                    <span className="text-charcoal">{new Date(chatData.eventDate + 'T00:00:00').toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Description:</span>
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
          <h1 className="text-2xl font-bold text-charcoal">Quick Request</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tell us what you need in just a few steps
          </p>
        </div>

        <ProgressDots currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Step Content */}
        <div className="min-h-[400px]">
          {!isAnimating && renderStep()}
        </div>

        {/* Footer link to full form */}
        <div className="text-center mt-12 text-sm text-gray-400">
          Need more options?{' '}
          <Link to="/custom-request" className="text-academica-blue hover:underline">
            Use the full request form
          </Link>
        </div>
      </div>
    </div>
  );
}
