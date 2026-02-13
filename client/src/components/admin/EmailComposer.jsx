import { useState, useRef } from 'react';

export default function EmailComposer({ recipientEmail, orderNumber, order, onSend, sending }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showPreview, setShowPreview] = useState(true);
  const [includeOrderDetails, setIncludeOrderDetails] = useState(true);
  const fileInputRef = useRef(null);

  const generateDefaultContent = () => {
    const contactName = order?.shippingInfo?.contactName || 'Valued Customer';
    const firstName = contactName.split(' ')[0];

    const defaultSubject = `Update on Your Order #${order?.orderNumber || ''}`;

    // Simple plain text message - professional HTML tables generated on backend
    const defaultBody = `Hi ${firstName},

Thank you for your order with AcademicaMart.

[Your message here]

Best regards,
AcademicaMart Team`;

    return { defaultSubject, defaultBody };
  };

  const formatOptionLabel = (key) => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const handleExpand = () => {
    const { defaultSubject, defaultBody } = generateDefaultContent();
    setSubject(defaultSubject);
    setBody(defaultBody);
    setIsExpanded(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      alert('Please enter a subject and message');
      return;
    }

    const success = await onSend({
      subject: subject.trim(),
      body: body.trim(),
      attachments: attachments,
      includeOrderDetails
    });
    if (success) {
      setSubject('');
      setBody('');
      setAttachments([]);
      setIsExpanded(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setBody('');
    setAttachments([]);
    setIsExpanded(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = ''; // Reset input
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-academica-blue hover:text-academica-blue transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Compose Email
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <span className="font-medium text-charcoal">New Email</span>
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* To field */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-sm">
        <span className="text-gray-500">To:</span>
        <span className="text-charcoal">{recipientEmail}</span>
      </div>

      {/* CC field - if additional emails exist */}
      {order?.shippingInfo?.additionalEmails?.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-sm bg-gray-50">
          <span className="text-gray-500">CC:</span>
          <span className="text-charcoal">{order.shippingInfo.additionalEmails.join(', ')}</span>
        </div>
      )}

      {/* Subject */}
      <div className="px-4 py-2 border-b border-gray-100">
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border-none p-0 focus:ring-0 text-charcoal placeholder-gray-400"
        />
      </div>

      {/* Body */}
      <div className="px-4 py-2">
        <textarea
          placeholder="Write your message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="w-full border-none p-0 focus:ring-0 text-charcoal placeholder-gray-400 resize-none text-sm"
        />
      </div>

      {/* Order Details Toggle */}
      <div className="mx-4 mb-3 border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-3 py-1.5 bg-gray-50 flex items-center justify-between text-xs font-medium text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeOrderDetails}
              onChange={(e) => setIncludeOrderDetails(e.target.checked)}
              className="rounded border-gray-300 text-academica-blue focus:ring-academica-blue"
            />
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Include Order Details
            </span>
          </label>
          {includeOrderDetails && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showPreview ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {includeOrderDetails && showPreview && order && (
          <div className="px-3 py-2 bg-white text-xs">
            {/* Order Information */}
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Order Information</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <div><span className="text-gray-400">Order #:</span> <span className="text-charcoal font-medium">{order.orderNumber}</span></div>
                {order.shippingInfo?.isInternalOrder ? (
                  <>
                    <div><span className="text-gray-400">Type:</span> <span className="text-purple-600 font-medium">Internal</span></div>
                    <div><span className="text-gray-400">Contact:</span> <span className="text-charcoal">{order.shippingInfo?.contactName || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Dept:</span> <span className="text-charcoal">{order.shippingInfo?.department || 'N/A'}</span></div>
                  </>
                ) : (
                  <>
                    <div><span className="text-gray-400">School:</span> <span className="text-charcoal">{order.shippingInfo?.schoolName || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Contact:</span> <span className="text-charcoal">{order.shippingInfo?.contactName || 'N/A'}{order.shippingInfo?.positionTitle && ` - ${order.shippingInfo.positionTitle}`}</span></div>
                    <div><span className="text-gray-400">Phone:</span> <span className="text-charcoal">{order.shippingInfo?.phone || 'N/A'}</span></div>
                  </>
                )}
                <div className="col-span-2"><span className="text-gray-400">Email:</span> <span className="text-charcoal">{order.shippingInfo?.email || 'N/A'}</span></div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Order Items</div>
              <div className="space-y-1.5">
                {order.items?.map((item, index) => {
                  const opts = item.selectedOptions || item.options || {};
                  return (
                    <div key={index} className="bg-gray-50 rounded px-2 py-1.5">
                      <div className="font-medium text-charcoal">{item.name}</div>
                      {Object.keys(opts).length > 0 && (
                        <div className="text-[11px] text-gray-500 mt-0.5 space-y-0.5">
                          {Object.entries(opts).map(([key, value]) => {
                            if (!value || key === 'customText' || key === 'artworkOption' || key === 'attachments') return null;
                            if (typeof value === 'object') {
                              return (
                                <div key={key}>
                                  <span className="text-gray-400">{formatOptionLabel(key)}:</span> {Array.isArray(value) ? value.join(', ') : JSON.stringify(value)}
                                </div>
                              );
                            }
                            return (
                              <div key={key}>
                                <span className="text-gray-400">{formatOptionLabel(key)}:</span> {value}
                              </div>
                            );
                          })}
                          {opts.artworkOption && (
                            <div>
                              <span className="text-gray-400">Artwork:</span> {opts.artworkOption === 'use_existing' ? 'Use existing artwork' : opts.artworkOption === 'send_later' ? 'Will send later' : opts.artworkOption}
                            </div>
                          )}
                          {opts.customText && typeof opts.customText === 'object' && (
                            <>
                              {opts.customText.headline && (
                                <div><span className="text-gray-400">Headline:</span> {opts.customText.headline}</div>
                              )}
                              {opts.customText.subheadline && (
                                <div><span className="text-gray-400">Subheadline:</span> {opts.customText.subheadline}</div>
                              )}
                              {opts.customText.bodyText && (
                                <div><span className="text-gray-400">Body Text:</span> {opts.customText.bodyText}</div>
                              )}
                            </>
                          )}
                          {opts.customText && typeof opts.customText === 'string' && (
                            <div><span className="text-gray-400">Custom Text:</span> {opts.customText}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">Attachments ({attachments.length})</div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                {attachment.preview ? (
                  <img src={attachment.preview} alt="" className="w-8 h-8 object-cover rounded" />
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-charcoal max-w-32">{attachment.name}</div>
                  <div className="text-xs text-gray-400">{formatFileSize(attachment.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-academica-blue hover:bg-gray-100 rounded transition-colors"
            title="Add attachment"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <span className="text-xs text-gray-500">
            Customer can reply directly
          </span>
        </div>
        <button
          type="submit"
          disabled={sending || !subject.trim() || !body.trim()}
          className="px-4 py-2 bg-academica-blue text-white rounded-md hover:bg-academica-blue-dark disabled:opacity-50 flex items-center gap-2"
        >
          {sending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Sending...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </>
          )}
        </button>
      </div>
    </form>
  );
}
