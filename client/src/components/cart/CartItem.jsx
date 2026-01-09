import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { productsAPI } from '../../services/api';

export default function CartItem({ item }) {
  const { updateQuantity, updateCartItem, removeFromCart } = useCart();
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [product, setProduct] = useState(null);
  const [editedOptions, setEditedOptions] = useState({});
  const [editedCustomText, setEditedCustomText] = useState({});
  const [editedArtworkOption, setEditedArtworkOption] = useState('');

  // Parse selected options from item
  const selectedOptions = typeof item.selectedOptions === 'string'
    ? JSON.parse(item.selectedOptions)
    : item.selectedOptions || {};

  useEffect(() => {
    if (isEditing && !product) {
      loadProduct();
    }
  }, [isEditing]);

  useEffect(() => {
    // Initialize edited values when entering edit mode
    if (isEditing) {
      const { customText, artworkOption, ...options } = selectedOptions;
      setEditedOptions(options || {});
      setEditedCustomText(customText || {});
      setEditedArtworkOption(artworkOption || 'upload-later');
    }
  }, [isEditing]);

  const loadProduct = async () => {
    try {
      const response = await productsAPI.getById(item.productId);
      setProduct(response.data.product);
    } catch (error) {
      console.error('Failed to load product:', error);
    }
  };

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setUpdating(true);
      await updateQuantity(item.id, newQuantity);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUpdating(true);
      await removeFromCart(item.id);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setUpdating(true);
      const fullOptions = {
        ...editedOptions,
        customText: editedCustomText,
        artworkOption: editedArtworkOption,
      };
      await updateCartItem(item.id, item.quantity, fullOptions);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleOptionChange = (key, value) => {
    setEditedOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleTextChange = (field, value) => {
    setEditedCustomText(prev => ({ ...prev, [field]: value }));
  };

  const getOptionLabel = (key) => {
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

  const getOptionValues = (optionConfig) => {
    if (!optionConfig) return [];
    if (Array.isArray(optionConfig)) return optionConfig;
    if (optionConfig.values && Array.isArray(optionConfig.values)) return optionConfig.values;
    return [];
  };

  const getArtworkLabel = (option) => {
    const labels = {
      'upload-later': 'Upload Later',
      'design-service': 'Design Service',
      'use-template': 'Use Template',
      'print-ready': 'Print-Ready Files',
    };
    return labels[option] || option;
  };

  // Get display options (excluding customText and artworkOption for summary display)
  const { customText, artworkOption, ...displayOptions } = selectedOptions;

  return (
    <div className={`bg-white rounded-lg shadow-sm ${updating ? 'opacity-50' : ''}`}>
      {/* Main Item Row */}
      <div className="flex items-start gap-4 p-4">
        {/* Product Image */}
        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=100&h=100&fit=crop'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-gray-900">{item.name}</h3>

          {/* Display Selected Options */}
          <div className="mt-2 space-y-1">
            {Object.entries(displayOptions).map(([key, value]) => (
              <div key={key} className="text-sm text-gray-600">
                <span className="font-medium">{getOptionLabel(key)}:</span> {value}
              </div>
            ))}
            {artworkOption && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Artwork:</span> {getArtworkLabel(artworkOption)}
              </div>
            )}
          </div>

          {/* Custom Text Summary */}
          {customText && Object.values(customText).some(v => v) && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
              <div className="font-medium text-gray-700 mb-1">Custom Content:</div>
              {customText.headline && <div className="text-gray-600 truncate">Headline: {customText.headline}</div>}
              {customText.bodyText && <div className="text-gray-600 truncate">Body: {customText.bodyText.substring(0, 50)}...</div>}
            </div>
          )}

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-2 text-sm text-academica-blue hover:text-academica-blue-600 font-medium"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Options'}
          </button>
        </div>

        {/* Remove Button */}
        <div className="flex flex-col items-end">
          <button
            onClick={handleRemove}
            disabled={updating}
            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Edit Panel */}
      {isEditing && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {!product ? (
            <div className="text-center py-4 text-gray-500">Loading options...</div>
          ) : (
            <div className="space-y-6">
              {/* Product Options */}
              {product.options && Object.keys(product.options).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Product Options</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(product.options).map(([key, optionConfig]) => {
                      const values = getOptionValues(optionConfig);
                      if (values.length === 0) return null;

                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {getOptionLabel(key)}
                          </label>
                          <select
                            value={editedOptions[key] || values[0]}
                            onChange={(e) => handleOptionChange(key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-academica-blue text-sm"
                          >
                            {values.map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Text */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Custom Content</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                    <input
                      type="text"
                      value={editedCustomText.headline || ''}
                      onChange={(e) => handleTextChange('headline', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                    <input
                      type="text"
                      value={editedCustomText.subheadline || ''}
                      onChange={(e) => handleTextChange('subheadline', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
                    <textarea
                      value={editedCustomText.bodyText || ''}
                      onChange={(e) => handleTextChange('bodyText', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action</label>
                    <input
                      type="text"
                      value={editedCustomText.callToAction || ''}
                      onChange={(e) => handleTextChange('callToAction', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                    <textarea
                      value={editedCustomText.contactInfo || ''}
                      onChange={(e) => handleTextChange('contactInfo', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      value={editedCustomText.additionalNotes || ''}
                      onChange={(e) => handleTextChange('additionalNotes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Artwork Option */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Artwork Option</h4>
                <select
                  value={editedArtworkOption}
                  onChange={(e) => setEditedArtworkOption(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-academica-blue text-sm"
                >
                  <option value="upload-later">Upload Files Later</option>
                  <option value="design-service">Use Our Design Service</option>
                  <option value="use-template">Use Academica Template</option>
                  <option value="print-ready">I Have Print-Ready Files</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveChanges}
                  disabled={updating}
                  className="flex-1 py-2 px-4 bg-academica-blue text-white rounded-md hover:bg-academica-blue-600 font-medium disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={updating}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
