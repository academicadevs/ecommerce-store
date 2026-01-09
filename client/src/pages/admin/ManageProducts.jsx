import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const categoryData = {
  'Marketing Materials': ['Flyers', 'Postcards', 'Brochures', 'Business Cards', 'Posters'],
  'Signs & Banners': ['Banners', 'Banner Stands', 'Yard Signs', 'A-Frame Signs'],
  'Apparel & Promo': ['T-Shirts', 'Bags', 'Writing Instruments', 'Drinkware', 'Lanyards'],
  'Booklets & Guides': ['Enrollment Materials', 'Folders'],
  'Trade Show': ['Table Displays', 'Backdrops', 'Flags'],
  'Custom Requests': ['Custom Design', 'Special Projects', 'Rush Orders', 'Other'],
};

const categories = Object.keys(categoryData);

// Common option templates for quick adding
const optionTemplates = {
  size: {
    label: 'Size',
    values: ['Small', 'Medium', 'Large'],
    default: 'Medium'
  },
  quantity: {
    label: 'Quantity',
    values: ['25', '50', '100', '250', '500', '1000', '2500', '5000'],
    default: '100'
  },
  paperType: {
    label: 'Paper Type',
    values: ['14pt Gloss', '14pt Matte', '16pt Gloss', '16pt Matte'],
    default: '14pt Gloss'
  },
  turnaround: {
    label: 'Turnaround Time',
    values: ['3 Business Days', '5 Business Days', '7 Business Days'],
    default: '5 Business Days'
  },
  printedSides: {
    label: 'Printed Sides',
    values: ['Front Only', 'Front & Back'],
    default: 'Front Only'
  },
  coating: {
    label: 'Coating',
    values: ['None', 'Gloss UV', 'Matte Finish', 'Spot UV'],
    default: 'None'
  },
  color: {
    label: 'Color',
    values: ['White', 'Black', 'Navy', 'Red', 'Custom'],
    default: 'White'
  },
  material: {
    label: 'Material',
    values: ['Standard', 'Premium', 'Eco-Friendly'],
    default: 'Standard'
  }
};

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: categories[0],
    subcategory: '',
    imageUrl: '',
    images: [],
    options: {},
    features: [],
    inStock: true,
  });
  const [saving, setSaving] = useState(false);

  // For adding new options
  const [newOptionKey, setNewOptionKey] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValues, setNewOptionValues] = useState('');
  const [newOptionDefault, setNewOptionDefault] = useState('');

  // For adding new features
  const [newFeature, setNewFeature] = useState('');

  // For adding new images
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await adminAPI.getProducts();
      setProducts(response.data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        subcategory: product.subcategory || '',
        imageUrl: product.imageUrl || '',
        images: product.images || [],
        options: product.options || {},
        features: product.features || [],
        inStock: product.inStock,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: categories[0],
        subcategory: '',
        imageUrl: '',
        images: [],
        options: {},
        features: [],
        inStock: true,
      });
    }
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setNewOptionKey('');
    setNewOptionLabel('');
    setNewOptionValues('');
    setNewOptionDefault('');
    setNewFeature('');
    setNewImageUrl('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        category: value,
        subcategory: '',
      }));
    }
  };

  // Options management
  const handleAddOption = () => {
    if (!newOptionKey.trim()) return;

    const values = newOptionValues.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) return;

    const newOption = {
      label: newOptionLabel || newOptionKey,
      values: values,
      default: newOptionDefault || values[0]
    };

    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [newOptionKey.trim()]: newOption
      }
    }));

    setNewOptionKey('');
    setNewOptionLabel('');
    setNewOptionValues('');
    setNewOptionDefault('');
  };

  const handleAddOptionFromTemplate = (templateKey) => {
    const template = optionTemplates[templateKey];
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [templateKey]: { ...template }
      }
    }));
  };

  const handleRemoveOption = (optionKey) => {
    setFormData(prev => {
      const newOptions = { ...prev.options };
      delete newOptions[optionKey];
      return { ...prev, options: newOptions };
    });
  };

  const handleUpdateOption = (optionKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [optionKey]: {
          ...prev.options[optionKey],
          [field]: field === 'values' ? value.split(',').map(v => v.trim()).filter(v => v) : value
        }
      }
    }));
  };

  // Features management
  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, newFeature.trim()]
    }));
    setNewFeature('');
  };

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  // Images management
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()]
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || null,
        imageUrl: formData.imageUrl || null,
        images: formData.images.length > 0 ? formData.images : null,
        options: Object.keys(formData.options).length > 0 ? formData.options : null,
        features: formData.features.length > 0 ? formData.features : null,
        inStock: formData.inStock,
      };

      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, data);
      } else {
        await adminAPI.createProduct(data);
      }

      handleCloseModal();
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await adminAPI.deleteProduct(productId);
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const availableSubcategories = categoryData[formData.category] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/admin" className="text-gray-500 hover:text-academica-blue text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-charcoal">Manage Products</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Options
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-charcoal">{product.name}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className="badge badge-blue">{product.category}</span>
                      {product.subcategory && (
                        <p className="text-xs text-gray-500 mt-1">{product.subcategory}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {product.options ? Object.keys(product.options).length : 0} options
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${product.inStock ? 'badge-success' : 'badge-danger'}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="text-academica-blue hover:text-academica-blue-600 font-medium mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseModal}></div>

            <div className="relative bg-white rounded-lg max-w-4xl w-full mx-auto shadow-xl my-8">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-charcoal">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {['basic', 'options', 'features', 'images'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium border-b-2 capitalize ${
                        activeTab === tab
                          ? 'border-academica-blue text-academica-blue'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab === 'basic' ? 'Basic Info' : tab === 'options' ? 'Configurator Options' : tab}
                    </button>
                  ))}
                </nav>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {/* Basic Info Tab */}
                  {activeTab === 'basic' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="input"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={3}
                          className="input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                          </label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="input"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subcategory
                          </label>
                          <select
                            name="subcategory"
                            value={formData.subcategory}
                            onChange={handleChange}
                            className="input"
                          >
                            <option value="">-- Select --</option>
                            {availableSubcategories.map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Image URL
                        </label>
                        <input
                          type="text"
                          name="imageUrl"
                          value={formData.imageUrl}
                          onChange={handleChange}
                          className="input"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="inStock"
                          id="inStock"
                          checked={formData.inStock}
                          onChange={handleChange}
                          className="h-4 w-4 text-academica-blue focus:ring-academica-blue border-gray-300 rounded"
                        />
                        <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
                          In Stock
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Options Tab */}
                  {activeTab === 'options' && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Configurator Options</h4>
                        <p className="text-sm text-blue-700">
                          These options appear as dropdowns in the product configurator. Each option has a key (internal name), label (display name), values (comma-separated choices), and a default value.
                        </p>
                      </div>

                      {/* Quick Add Templates */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quick Add Common Options
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(optionTemplates).map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleAddOptionFromTemplate(key)}
                              disabled={formData.options[key]}
                              className={`px-3 py-1 text-sm rounded-full border ${
                                formData.options[key]
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'bg-white text-academica-blue border-academica-blue hover:bg-academica-blue hover:text-white'
                              }`}
                            >
                              + {optionTemplates[key].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Current Options */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Options ({Object.keys(formData.options).length})
                        </label>

                        {Object.keys(formData.options).length === 0 ? (
                          <p className="text-gray-500 text-sm italic">No options added yet. Use quick add above or add custom options below.</p>
                        ) : (
                          <div className="space-y-4">
                            {Object.entries(formData.options).map(([key, option]) => (
                              <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <span className="text-xs text-gray-500 font-mono">Key: {key}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(key)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Label</label>
                                    <input
                                      type="text"
                                      value={option.label || ''}
                                      onChange={(e) => handleUpdateOption(key, 'label', e.target.value)}
                                      className="input text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Values (comma-separated)</label>
                                    <input
                                      type="text"
                                      value={option.values?.join(', ') || ''}
                                      onChange={(e) => handleUpdateOption(key, 'values', e.target.value)}
                                      className="input text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">Default</label>
                                    <select
                                      value={option.default || ''}
                                      onChange={(e) => handleUpdateOption(key, 'default', e.target.value)}
                                      className="input text-sm"
                                    >
                                      {option.values?.map((val) => (
                                        <option key={val} value={val}>{val}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Custom Option */}
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Add Custom Option
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Key *</label>
                            <input
                              type="text"
                              value={newOptionKey}
                              onChange={(e) => setNewOptionKey(e.target.value.replace(/\s+/g, ''))}
                              placeholder="e.g., binding"
                              className="input text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Label</label>
                            <input
                              type="text"
                              value={newOptionLabel}
                              onChange={(e) => setNewOptionLabel(e.target.value)}
                              placeholder="e.g., Binding Type"
                              className="input text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Values *</label>
                            <input
                              type="text"
                              value={newOptionValues}
                              onChange={(e) => setNewOptionValues(e.target.value)}
                              placeholder="Spiral, Saddle Stitch, Perfect"
                              className="input text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Default</label>
                            <input
                              type="text"
                              value={newOptionDefault}
                              onChange={(e) => setNewOptionDefault(e.target.value)}
                              placeholder="First value if empty"
                              className="input text-sm"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddOption}
                          disabled={!newOptionKey.trim() || !newOptionValues.trim()}
                          className="mt-3 px-4 py-2 bg-academica-blue text-white rounded-md text-sm hover:bg-academica-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Features Tab */}
                  {activeTab === 'features' && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Product Features</h4>
                        <p className="text-sm text-green-700">
                          Features are displayed as bullet points on the product detail page. Use these to highlight key selling points.
                        </p>
                      </div>

                      {/* Current Features */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Features ({formData.features.length})
                        </label>

                        {formData.features.length === 0 ? (
                          <p className="text-gray-500 text-sm italic">No features added yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {formData.features.map((feature, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={feature}
                                  onChange={(e) => handleUpdateFeature(index, e.target.value)}
                                  className="input flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeature(index)}
                                  className="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Feature */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Enter a product feature..."
                          className="input flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddFeature();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddFeature}
                          disabled={!newFeature.trim()}
                          className="px-4 py-2 bg-academica-blue text-white rounded-md hover:bg-academica-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>

                      {/* Common Features Suggestions */}
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quick Add Common Features
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'Full color printing',
                            'Free shipping on orders over $100',
                            'Proof approval before printing',
                            'Premium quality materials',
                            'Fast turnaround available',
                            'Custom sizes available',
                            'Eco-friendly options',
                            'Bulk discounts available'
                          ].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                if (!formData.features.includes(suggestion)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    features: [...prev.features, suggestion]
                                  }));
                                }
                              }}
                              disabled={formData.features.includes(suggestion)}
                              className={`px-3 py-1 text-sm rounded-full border ${
                                formData.features.includes(suggestion)
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-academica-blue hover:text-academica-blue'
                              }`}
                            >
                              + {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Images Tab */}
                  {activeTab === 'images' && (
                    <div className="space-y-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-medium text-purple-900 mb-2">Product Images</h4>
                        <p className="text-sm text-purple-700">
                          Add multiple image URLs for the product gallery. The primary image is set in Basic Info. These additional images appear as thumbnails.
                        </p>
                      </div>

                      {/* Current Images */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gallery Images ({formData.images.length})
                        </label>

                        {formData.images.length === 0 ? (
                          <p className="text-gray-500 text-sm italic">No additional images added.</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-4">
                            {formData.images.map((imageUrl, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={imageUrl}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <p className="text-xs text-gray-500 mt-1 truncate">{imageUrl}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Image */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="Enter image URL (https://...)"
                          className="input flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImage();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddImage}
                          disabled={!newImageUrl.trim()}
                          className="px-4 py-2 bg-academica-blue text-white rounded-md hover:bg-academica-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Add Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                  <div className="text-sm text-gray-500">
                    {activeTab === 'options' && `${Object.keys(formData.options).length} options configured`}
                    {activeTab === 'features' && `${formData.features.length} features added`}
                    {activeTab === 'images' && `${formData.images.length} images added`}
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
