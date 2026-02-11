import { useState } from 'react';

export default function SpecialRequestEditModal({ item, onSave, onClose, saving }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(item.selectedOptions || {})));

  const requestType = draft.requestType;

  // Helper to update nested paths like 'targetAudience.geographicArea'
  const updateNested = (path, value) => {
    setDraft(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const updateField = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      ...item,
      selectedOptions: draft,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-charcoal">
              Edit: {item.name}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {requestType === 'custom' ? (
              <>
                {/* Custom Request Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Project Type</label>
                    <input type="text" value={draft.projectType || ''} onChange={(e) => updateField('projectType', e.target.value)} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Project Title</label>
                    <input type="text" value={draft.projectTitle || ''} onChange={(e) => updateField('projectTitle', e.target.value)} className="input w-full text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Timeline</label>
                    <input type="text" value={draft.timeline || ''} onChange={(e) => updateField('timeline', e.target.value)} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Event Date</label>
                    <input type="date" value={draft.eventDate || ''} onChange={(e) => updateField('eventDate', e.target.value)} className="input w-full text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Material Types (comma-separated)</label>
                  <input type="text" value={(draft.materialTypes || []).join(', ')} onChange={(e) => updateField('materialTypes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="input w-full text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Project Description</label>
                  <textarea value={draft.projectDescription || ''} onChange={(e) => updateField('projectDescription', e.target.value)} rows={3} className="input w-full text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Objectives</label>
                    <textarea value={draft.objectives || ''} onChange={(e) => updateField('objectives', e.target.value)} rows={2} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Target Audience</label>
                    <textarea value={draft.targetAudience || ''} onChange={(e) => updateField('targetAudience', e.target.value)} rows={2} className="input w-full text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Key Messages</label>
                  <textarea value={draft.keyMessages || ''} onChange={(e) => updateField('keyMessages', e.target.value)} rows={2} className="input w-full text-sm" />
                </div>

                {/* Specifications */}
                <div className="bg-gray-50 rounded p-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Specifications</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                      <input type="text" value={draft.specifications?.quantity || ''} onChange={(e) => updateNested('specifications.quantity', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Size Requirements</label>
                      <input type="text" value={draft.specifications?.sizeRequirements || ''} onChange={(e) => updateNested('specifications.sizeRequirements', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Color Preferences</label>
                      <input type="text" value={draft.specifications?.colorPreferences || ''} onChange={(e) => updateNested('specifications.colorPreferences', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Existing Branding</label>
                      <input type="text" value={draft.specifications?.existingBranding || ''} onChange={(e) => updateNested('specifications.existingBranding', e.target.value)} className="input w-full text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Budget Range</label>
                  <input type="text" value={draft.budgetRange || ''} onChange={(e) => updateField('budgetRange', e.target.value)} className="input w-full text-sm" />
                </div>

                {/* Files - editable text fields, attachments remain read-only */}
                <div className="bg-purple-50 rounded p-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Files & References</label>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Reference Links</label>
                      <input type="text" value={draft.files?.referenceLinks || ''} onChange={(e) => updateNested('files.referenceLinks', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">File Description</label>
                      <input type="text" value={draft.files?.fileDescription || ''} onChange={(e) => updateNested('files.fileDescription', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Inspiration Notes</label>
                      <textarea value={draft.files?.inspirationNotes || ''} onChange={(e) => updateNested('files.inspirationNotes', e.target.value)} rows={2} className="input w-full text-sm" />
                    </div>
                  </div>
                  {draft.attachments?.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {draft.attachments.length} attachment(s) (read-only)
                    </div>
                  )}
                </div>
              </>
            ) : requestType === 'meta-ads' ? (
              <>
                {/* Meta-Ads Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Campaign Objective</label>
                    <input type="text" value={draft.campaignObjective || ''} onChange={(e) => updateField('campaignObjective', e.target.value)} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Campaign Name</label>
                    <input type="text" value={draft.campaignName || ''} onChange={(e) => updateField('campaignName', e.target.value)} className="input w-full text-sm" />
                  </div>
                </div>

                {/* Target Audience */}
                <div className="bg-blue-50 rounded p-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Target Audience</label>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Demographics (comma-separated)</label>
                      <input type="text" value={(draft.targetAudience?.demographics || []).join(', ')} onChange={(e) => updateNested('targetAudience.demographics', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="input w-full text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Geographic Area</label>
                        <input type="text" value={draft.targetAudience?.geographicArea || ''} onChange={(e) => updateNested('targetAudience.geographicArea', e.target.value)} className="input w-full text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Radius (miles)</label>
                        <input type="text" value={draft.targetAudience?.radiusMiles || ''} onChange={(e) => updateNested('targetAudience.radiusMiles', e.target.value)} className="input w-full text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Additional Targeting</label>
                      <input type="text" value={draft.targetAudience?.additionalTargeting || ''} onChange={(e) => updateNested('targetAudience.additionalTargeting', e.target.value)} className="input w-full text-sm" />
                    </div>
                  </div>
                </div>

                {/* Budget & Timeline */}
                <div className="bg-green-50 rounded p-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Budget & Timeline</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Monthly Budget</label>
                      <input type="text" value={draft.budgetTimeline?.monthlyBudget || ''} onChange={(e) => updateNested('budgetTimeline.monthlyBudget', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Duration</label>
                      <input type="text" value={draft.budgetTimeline?.duration || ''} onChange={(e) => updateNested('budgetTimeline.duration', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input type="date" value={draft.budgetTimeline?.startDate || ''} onChange={(e) => updateNested('budgetTimeline.startDate', e.target.value)} className="input w-full text-sm" />
                    </div>
                  </div>
                </div>

                {/* Creative */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Creative & Content</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Has Creative Assets</label>
                      <input type="text" value={draft.creative?.hasCreativeAssets || ''} onChange={(e) => updateNested('creative.hasCreativeAssets', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Call to Action</label>
                      <input type="text" value={draft.creative?.callToAction || ''} onChange={(e) => updateNested('creative.callToAction', e.target.value)} className="input w-full text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Creative Description</label>
                    <textarea value={draft.creative?.creativeDescription || ''} onChange={(e) => updateNested('creative.creativeDescription', e.target.value)} rows={2} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Key Messages</label>
                    <textarea value={draft.creative?.keyMessages || ''} onChange={(e) => updateNested('creative.keyMessages', e.target.value)} rows={2} className="input w-full text-sm" />
                  </div>
                </div>

                {/* Landing Page */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Has Landing Page</label>
                    <input type="text" value={draft.landingPage?.hasLandingPage || ''} onChange={(e) => updateNested('landingPage.hasLandingPage', e.target.value)} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Landing Page URL</label>
                    <input type="text" value={draft.landingPage?.landingPageUrl || ''} onChange={(e) => updateNested('landingPage.landingPageUrl', e.target.value)} className="input w-full text-sm" />
                  </div>
                </div>

                {/* Meta Presence */}
                <div className="bg-indigo-50 rounded p-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Meta/Facebook Presence</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Facebook Page</label>
                      <input type="text" value={draft.metaPresence?.hasFacebookPage || ''} onChange={(e) => updateNested('metaPresence.hasFacebookPage', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Facebook URL</label>
                      <input type="text" value={draft.metaPresence?.facebookPageUrl || ''} onChange={(e) => updateNested('metaPresence.facebookPageUrl', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                      <input type="text" value={draft.metaPresence?.hasInstagramAccount || ''} onChange={(e) => updateNested('metaPresence.hasInstagramAccount', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Instagram Handle</label>
                      <input type="text" value={draft.metaPresence?.instagramHandle || ''} onChange={(e) => updateNested('metaPresence.instagramHandle', e.target.value)} className="input w-full text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Meta Ads Account</label>
                      <input type="text" value={draft.metaPresence?.hasMetaAdsAccount || ''} onChange={(e) => updateNested('metaPresence.hasMetaAdsAccount', e.target.value)} className="input w-full text-sm" />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Previous Ad Experience</label>
                    <textarea value={draft.additionalInfo?.previousAdExperience || ''} onChange={(e) => updateNested('additionalInfo.previousAdExperience', e.target.value)} rows={2} className="input w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Competitor Schools</label>
                    <textarea value={draft.additionalInfo?.competitorSchools || ''} onChange={(e) => updateNested('additionalInfo.competitorSchools', e.target.value)} rows={2} className="input w-full text-sm" />
                  </div>
                </div>
              </>
            ) : null}

            {/* Additional Notes (common to both types) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
              <textarea value={draft.additionalNotes || ''} onChange={(e) => updateField('additionalNotes', e.target.value)} rows={3} className="input w-full text-sm" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-academica-blue text-white rounded-md hover:bg-academica-blue-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
