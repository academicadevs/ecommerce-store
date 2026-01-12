import { useState, useEffect } from 'react';
import { productsAPI } from '../../services/api';

export default function ItemEditModal({ item, onSave, onClose, saving }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configure');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [customText, setCustomText] = useState({
    headline: '',
    subheadline: '',
    bodyText: '',
    callToAction: '',
    contactInfo: '',
    additionalNotes: '',
  });
  const [artworkOption, setArtworkOption] = useState('upload-later');

  useEffect(() => {
    loadProduct();
  }, [item]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(item.productId);
      setProduct(response.data.product);

      // Initialize from item's current options
      const opts = item.selectedOptions || {};
      const { customText: ct, artworkOption: ao, ...restOpts } = opts;

      setSelectedOptions(restOpts);
      if (ct && typeof ct === 'object') {
        setCustomText({
          headline: ct.headline || '',
          subheadline: ct.subheadline || '',
          bodyText: ct.bodyText || '',
          callToAction: ct.callToAction || '',
          contactInfo: ct.contactInfo || '',
          additionalNotes: ct.additionalNotes || '',
        });
      }
      if (ao) {
        setArtworkOption(ao);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOptionValues = (optionConfig) => {
    if (!optionConfig) return [];
    if (Array.isArray(optionConfig)) return optionConfig;
    if (optionConfig.values && Array.isArray(optionConfig.values)) return optionConfig.values;
    return [];
  };

  const getOptionLabel = (key, optionConfig) => {
    if (optionConfig && optionConfig.label) return optionConfig.label;
    const labels = {
      size: 'Size',
      paperType: 'Paper Type',
      quantity: 'Quantity',
      turnaround: 'Turnaround Time',
      printedSide: 'Printed Sides',
      printedSides: 'Printed Sides',
      folding: 'Folding',
      finishing: 'Finishing',
      finish: 'Finish',
      color: 'Color',
      material: 'Material',
      corners: 'Corners',
      bundling: 'Bundling',
      coating: 'Coating',
      cover: 'Cover Stock',
      binding: 'Binding',
      pages: 'Page Count',
      style: 'Style',
      displayType: 'Display Type',
      grommets: 'Grommets',
      stand: 'Stand Type',
      standType: 'Stand Type',
      base: 'Base Type',
      height: 'Height',
      printType: 'Print Type',
      printLocation: 'Print Location',
      inkColor: 'Ink Color',
      hardware: 'Hardware',
      width: 'Width',
      attachment: 'Attachment',
      pockets: 'Pocket Style',
      stakes: 'Include Stakes',
      frameColor: 'Frame Color',
      shape: 'Shape',
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const needsTextContent = () => {
    if (!product) return false;
    const printCategories = ['Marketing Materials', 'Signs & Banners', 'Booklets & Guides'];
    return printCategories.includes(product.category);
  };

  const handleOptionChange = (key, value) => {
    setSelectedOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleTextChange = (field, value) => {
    setCustomText(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const fullOptions = {
      ...selectedOptions,
      customText,
      artworkOption,
    };
    onSave({
      ...item,
      selectedOptions: fullOptions,
    });
  };

  const hasOptions = product?.options && Object.keys(product.options).length > 0;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-charcoal">Edit Item: {item.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-academica-blue"></div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-4 bg-white">
                <button
                  onClick={() => setActiveTab('configure')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === 'configure'
                      ? 'border-academica-blue text-academica-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Configure
                </button>
                {needsTextContent() && (
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                      activeTab === 'content'
                        ? 'border-academica-blue text-academica-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Content
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('artwork')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    activeTab === 'artwork'
                      ? 'border-academica-blue text-academica-blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Artwork
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Configure Tab */}
                {activeTab === 'configure' && (
                  <div className="space-y-3">
                    {hasOptions ? (
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(product.options).map(([optionKey, optionConfig]) => {
                          const values = getOptionValues(optionConfig);
                          const label = getOptionLabel(optionKey, optionConfig);
                          if (values.length === 0) return null;

                          return (
                            <div key={optionKey}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {label}
                              </label>
                              <select
                                value={selectedOptions[optionKey] || values[0]}
                                onChange={(e) => handleOptionChange(optionKey, e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-academica-blue"
                              >
                                {values.map((value) => (
                                  <option key={value} value={value}>{value}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No configuration options available.</p>
                    )}
                  </div>
                )}

                {/* Content Tab */}
                {activeTab === 'content' && needsTextContent() && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Headline</label>
                        <input
                          type="text"
                          value={customText.headline}
                          onChange={(e) => handleTextChange('headline', e.target.value)}
                          placeholder="e.g., Join Our School Today!"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-academica-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Subheadline</label>
                        <input
                          type="text"
                          value={customText.subheadline}
                          onChange={(e) => handleTextChange('subheadline', e.target.value)}
                          placeholder="e.g., Now Enrolling for Fall 2024"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-academica-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Body Text</label>
                      <textarea
                        value={customText.bodyText}
                        onChange={(e) => handleTextChange('bodyText', e.target.value)}
                        placeholder="Enter the main message..."
                        rows={3}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-academica-blue"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Call to Action</label>
                        <input
                          type="text"
                          value={customText.callToAction}
                          onChange={(e) => handleTextChange('callToAction', e.target.value)}
                          placeholder="e.g., Enroll Now!"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-academica-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Contact Info</label>
                        <input
                          type="text"
                          value={customText.contactInfo}
                          onChange={(e) => handleTextChange('contactInfo', e.target.value)}
                          placeholder="Phone, website, email..."
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-academica-blue"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Notes for Designer</label>
                      <textarea
                        value={customText.additionalNotes}
                        onChange={(e) => handleTextChange('additionalNotes', e.target.value)}
                        placeholder="Special instructions..."
                        rows={2}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-academica-blue"
                      />
                    </div>
                  </div>
                )}

                {/* Artwork Tab */}
                {activeTab === 'artwork' && (
                  <div className="space-y-2">
                    {[
                      { value: 'upload-later', label: 'Upload Files Later', desc: 'Instructions sent after ordering' },
                      { value: 'design-service', label: 'Use Design Service', desc: 'Our team creates your design' },
                      { value: 'use-template', label: 'Use Academica Template', desc: 'Use approved brand template' },
                      { value: 'print-ready', label: 'Print-Ready Files', desc: 'Upload your own files' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          artworkOption === option.value
                            ? 'border-academica-blue bg-academica-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="artwork"
                          value={option.value}
                          checked={artworkOption === option.value}
                          onChange={(e) => setArtworkOption(e.target.value)}
                        />
                        <div>
                          <div className="font-medium text-sm text-charcoal">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
