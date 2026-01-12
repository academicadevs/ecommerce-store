import { useState } from 'react';
import ItemEditModal from './ItemEditModal';

export default function OrderItemEditor({ items, onUpdate, saving }) {
  const [editedItems, setEditedItems] = useState(items || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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
          const { customText, artworkOption, ...displayOpts } = opts;

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
              {Object.keys(displayOpts).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Object.entries(displayOpts).map(([key, value]) => (
                    <span key={key} className="inline-flex text-[11px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                      {formatOptionLabel(key)}: {value}
                    </span>
                  ))}
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
    </div>
  );
}
