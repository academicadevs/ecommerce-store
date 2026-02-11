import { useState } from 'react';
import ItemEditModal from './ItemEditModal';
import SpecialRequestEditModal from './SpecialRequestEditModal';
import FilePreviewModal from '../common/FilePreviewModal';

// Component to display Custom Request details
function CustomRequestDetails({ data, onPreviewFile }) {
  if (!data || data.requestType !== 'custom') return null;

  return (
    <div className="mt-3 space-y-3 text-sm">
      {/* Project Info */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-xs text-gray-500 uppercase">Project Type</span>
          <p className="font-medium text-charcoal">{data.projectType}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase">Timeline</span>
          <p className="text-gray-700">{data.timeline}</p>
        </div>
      </div>

      {data.eventDate && (
        <div>
          <span className="text-xs text-gray-500 uppercase">Event Date</span>
          <p className="text-gray-700">{new Date(data.eventDate).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })}</p>
        </div>
      )}

      {/* Materials */}
      {data.materialTypes?.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 uppercase">Materials Needed</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.materialTypes.map((mat, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{mat}</span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <span className="text-xs text-gray-500 uppercase">Project Description</span>
        <p className="text-gray-700 whitespace-pre-wrap">{data.projectDescription}</p>
      </div>

      {/* Objectives & Audience */}
      <div className="grid grid-cols-2 gap-2">
        {data.objectives && (
          <div>
            <span className="text-xs text-gray-500 uppercase">Objectives</span>
            <p className="text-gray-700">{data.objectives}</p>
          </div>
        )}
        {data.targetAudience && (
          <div>
            <span className="text-xs text-gray-500 uppercase">Target Audience</span>
            <p className="text-gray-700">{data.targetAudience}</p>
          </div>
        )}
      </div>

      {data.keyMessages && (
        <div>
          <span className="text-xs text-gray-500 uppercase">Key Messages</span>
          <p className="text-gray-700">{data.keyMessages}</p>
        </div>
      )}

      {/* Specifications */}
      {data.specifications && Object.values(data.specifications).some(v => v) && (
        <div className="bg-gray-100 rounded p-2">
          <span className="text-xs text-gray-500 uppercase">Specifications</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {data.specifications.quantity && <p><span className="text-gray-500">Quantity:</span> {data.specifications.quantity}</p>}
            {data.specifications.sizeRequirements && <p><span className="text-gray-500">Size:</span> {data.specifications.sizeRequirements}</p>}
            {data.specifications.colorPreferences && <p><span className="text-gray-500">Colors:</span> {data.specifications.colorPreferences}</p>}
            {data.specifications.existingBranding && <p><span className="text-gray-500">Branding:</span> {data.specifications.existingBranding}</p>}
          </div>
        </div>
      )}

      {/* Files */}
      {data.files && (data.files.hasExistingFiles || data.files.fileDescription || data.files.referenceLinks) && (
        <div className="bg-purple-50 rounded p-2">
          <span className="text-xs text-gray-500 uppercase">Files & References</span>
          <div className="mt-1 space-y-1">
            {data.files.hasExistingFiles && <p className="text-purple-700">Has existing files to provide</p>}
            {data.files.fileDescription && <p><span className="text-gray-500">Files:</span> {data.files.fileDescription}</p>}
            {data.files.referenceLinks && <p><span className="text-gray-500">References:</span> {data.files.referenceLinks}</p>}
            {data.files.inspirationNotes && <p><span className="text-gray-500">Inspiration:</span> {data.files.inspirationNotes}</p>}
          </div>
        </div>
      )}

      {/* Attachments */}
      {data.attachments?.length > 0 && (
        <div className="bg-blue-50 rounded p-2">
          <span className="text-xs text-gray-500 uppercase">Attachments ({data.attachments.length})</span>
          <ul className="mt-1 space-y-1">
            {data.attachments.map((att) => (
              <li key={att.filename}>
                <button
                  type="button"
                  onClick={() => onPreviewFile?.(att)}
                  className="inline-flex items-center gap-1.5 text-sm text-academica-blue hover:underline"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {att.originalName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Budget */}
      {data.budgetRange && (
        <div>
          <span className="text-xs text-gray-500 uppercase">Budget Range</span>
          <p className="text-gray-700 font-medium">{data.budgetRange}</p>
        </div>
      )}
    </div>
  );
}

// Component to display Meta Ads Campaign details
function MetaAdsDetails({ data }) {
  if (!data || data.requestType !== 'meta-ads') return null;

  return (
    <div className="mt-3 space-y-3 text-sm">
      {/* Campaign Info */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-xs text-gray-500 uppercase">Campaign Objective</span>
          <p className="font-medium text-charcoal">{data.campaignObjective}</p>
          {data.otherObjective && <p className="text-gray-600 text-xs">{data.otherObjective}</p>}
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase">Campaign Name</span>
          <p className="text-gray-700">{data.campaignName}</p>
        </div>
      </div>

      {/* Target Audience */}
      {data.targetAudience && (
        <div className="bg-blue-50 rounded p-2">
          <span className="text-xs text-gray-500 uppercase">Target Audience</span>
          <div className="mt-1 space-y-1">
            {data.targetAudience.demographics?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.targetAudience.demographics.map((demo, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{demo}</span>
                ))}
              </div>
            )}
            <p><span className="text-gray-500">Location:</span> {data.targetAudience.geographicArea} ({data.targetAudience.radiusMiles} mi radius)</p>
            {data.targetAudience.additionalTargeting && (
              <p><span className="text-gray-500">Additional:</span> {data.targetAudience.additionalTargeting}</p>
            )}
          </div>
        </div>
      )}

      {/* Budget & Timeline */}
      {data.budgetTimeline && (
        <div className="grid grid-cols-3 gap-2 bg-green-50 rounded p-2">
          <div>
            <span className="text-xs text-gray-500 uppercase">Monthly Budget</span>
            <p className="font-medium text-green-800">{data.budgetTimeline.monthlyBudget}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Duration</span>
            <p className="text-gray-700">{data.budgetTimeline.duration}</p>
          </div>
          {data.budgetTimeline.startDate && (
            <div>
              <span className="text-xs text-gray-500 uppercase">Start Date</span>
              <p className="text-gray-700">{new Date(data.budgetTimeline.startDate).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })}</p>
            </div>
          )}
        </div>
      )}

      {/* Creative */}
      {data.creative && (
        <div>
          <span className="text-xs text-gray-500 uppercase">Creative & Content</span>
          <div className="mt-1 space-y-1">
            <p><span className="text-gray-500">Assets:</span> {data.creative.hasCreativeAssets}</p>
            {data.creative.creativeDescription && <p><span className="text-gray-500">Description:</span> {data.creative.creativeDescription}</p>}
            {data.creative.keyMessages && <p><span className="text-gray-500">Key Messages:</span> {data.creative.keyMessages}</p>}
            {data.creative.callToAction && <p><span className="text-gray-500">CTA:</span> <span className="font-medium">{data.creative.callToAction}</span></p>}
          </div>
        </div>
      )}

      {/* Landing Page */}
      {data.landingPage && (
        <div>
          <span className="text-xs text-gray-500 uppercase">Landing Page</span>
          <div className="mt-1">
            <p><span className="text-gray-500">Status:</span> {data.landingPage.hasLandingPage}</p>
            {data.landingPage.landingPageUrl && (
              <p><span className="text-gray-500">URL:</span> <a href={data.landingPage.landingPageUrl} target="_blank" rel="noopener noreferrer" className="text-academica-blue hover:underline">{data.landingPage.landingPageUrl}</a></p>
            )}
            {data.landingPage.needsLandingPage && <p className="text-amber-600">Needs landing page created</p>}
          </div>
        </div>
      )}

      {/* Meta Presence */}
      {data.metaPresence && (
        <div className="bg-indigo-50 rounded p-2">
          <span className="text-xs text-gray-500 uppercase">Meta/Facebook Presence</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <p><span className="text-gray-500">Facebook:</span> {data.metaPresence.hasFacebookPage}</p>
            {data.metaPresence.facebookPageUrl && (
              <a href={data.metaPresence.facebookPageUrl} target="_blank" rel="noopener noreferrer" className="text-academica-blue hover:underline text-xs truncate">{data.metaPresence.facebookPageUrl}</a>
            )}
            <p><span className="text-gray-500">Instagram:</span> {data.metaPresence.hasInstagramAccount}</p>
            {data.metaPresence.instagramHandle && <p className="text-gray-700">@{data.metaPresence.instagramHandle}</p>}
            <p><span className="text-gray-500">Ads Account:</span> {data.metaPresence.hasMetaAdsAccount}</p>
          </div>
        </div>
      )}

      {/* Additional Info */}
      {data.additionalInfo && (data.additionalInfo.previousAdExperience || data.additionalInfo.competitorSchools) && (
        <div>
          <span className="text-xs text-gray-500 uppercase">Additional Info</span>
          <div className="mt-1 space-y-1">
            {data.additionalInfo.previousAdExperience && (
              <p><span className="text-gray-500">Previous Experience:</span> {data.additionalInfo.previousAdExperience}</p>
            )}
            {data.additionalInfo.competitorSchools && (
              <p><span className="text-gray-500">Competitors:</span> {data.additionalInfo.competitorSchools}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderItemEditor({ items, onUpdate, saving }) {
  const [editedItems, setEditedItems] = useState(items || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingSpecialItem, setEditingSpecialItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const handleRemoveItem = (index) => {
    if (!confirm('Remove this item from the order?')) return;
    const updated = editedItems.filter((_, i) => i !== index);
    setEditedItems(updated);
    setHasChanges(true);
  };

  const handleEditItem = (index) => {
    setEditingItem({ index, item: editedItems[index] });
  };

  const handleSaveItem = (updatedItem) => {
    const updated = [...editedItems];
    updated[editingItem.index] = updatedItem;
    setEditedItems(updated);
    setHasChanges(true);
    setEditingItem(null);
  };

  const handleSaveSpecialItem = (updatedItem) => {
    const updated = [...editedItems];
    updated[editingSpecialItem.index] = updatedItem;
    setEditedItems(updated);
    setHasChanges(true);
    setEditingSpecialItem(null);
  };

  const handleSave = () => {
    onUpdate(editedItems);
    setHasChanges(false);
  };

  const handleReset = () => {
    setEditedItems(items || []);
    setHasChanges(false);
  };

  const getArtworkLabel = (option) => {
    const labels = {
      'upload-later': 'Upload Later',
      'design-service': 'Design Service',
      'use-template': 'Use Template',
      'print-ready': 'Print-Ready',
    };
    return labels[option] || option;
  };

  const formatOptionLabel = (key) => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
  };

  if (!editedItems || editedItems.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p className="text-sm">No items in this order</p>
      </div>
    );
  }

  return (
    <div>
      {/* Save/Reset buttons */}
      {hasChanges && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-between">
          <span className="text-yellow-800 text-xs font-medium">Unsaved changes</span>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              disabled={saving}
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-xs bg-academica-blue text-white rounded hover:bg-academica-blue-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {editedItems.map((item, index) => {
          const opts = item.selectedOptions || {};
          const isSpecialRequest = item.isSpecialRequest || opts.requestType;
          const requestType = item.requestType || opts.requestType;
          const { customText, artworkOption, requestType: _, ...displayOpts } = opts;

          // Special request items get expanded display
          if (isSpecialRequest) {
            return (
              <div key={index} className={`rounded-lg border-2 ${requestType === 'meta-ads' ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    {requestType === 'meta-ads' ? (
                      <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                    <div>
                      <h5 className="font-semibold text-charcoal">{item.name}</h5>
                      <span className={`text-xs ${requestType === 'meta-ads' ? 'text-indigo-600' : 'text-amber-600'}`}>
                        {requestType === 'meta-ads' ? 'Digital Ad Campaign' : 'Custom Request'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingSpecialItem({ index, item: editedItems[index] })}
                    className="p-1.5 text-gray-400 hover:text-academica-blue hover:bg-blue-50 rounded transition-colors"
                    title="Edit item"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {/* Request Details */}
                <div className="p-3">
                  {requestType === 'meta-ads' ? (
                    <MetaAdsDetails data={opts} />
                  ) : (
                    <CustomRequestDetails data={opts} onPreviewFile={setPreviewFile} />
                  )}
                  {/* Additional Notes */}
                  {opts.additionalNotes && (
                    <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                      <span className="text-xs text-gray-500 uppercase">Additional Notes</span>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{opts.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Regular product items
          return (
            <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
              {/* Item Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-charcoal text-sm truncate">{item.name}</h5>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEditItem(index)}
                    className="p-1.5 text-gray-400 hover:text-academica-blue hover:bg-blue-50 rounded transition-colors"
                    title="Edit item"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Options Summary */}
              {Object.keys(displayOpts).length > 0 && !isSpecialRequest && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Object.entries(displayOpts).map(([key, value]) => {
                    if (typeof value === 'object') return null;
                    return (
                      <span key={key} className="inline-flex text-[11px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                        {formatOptionLabel(key)}: {value}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Artwork */}
              {artworkOption && (
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {getArtworkLabel(artworkOption)}
                  </span>
                </div>
              )}

              {/* Custom Text Preview */}
              {customText && Object.values(customText).some(v => v && v.trim && v.trim()) && (
                <div className="mt-1.5 text-[11px] text-gray-500 bg-white border border-gray-200 rounded p-1.5">
                  {customText.headline && <div><span className="text-gray-400">Headline:</span> {customText.headline}</div>}
                  {customText.subheadline && <div><span className="text-gray-400">Subheadline:</span> {customText.subheadline}</div>}
                  {customText.bodyText && <div className="truncate"><span className="text-gray-400">Body:</span> {customText.bodyText}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <ItemEditModal
          item={editingItem.item}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
          saving={saving}
        />
      )}

      {/* Special Request Edit Modal */}
      {editingSpecialItem && (
        <SpecialRequestEditModal
          item={editingSpecialItem.item}
          onSave={handleSaveSpecialItem}
          onClose={() => setEditingSpecialItem(null)}
          saving={saving}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
