import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ProductDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('configure');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      const productData = response.data.product;
      setProduct(productData);

      // Initialize selected options with defaults
      if (productData.options) {
        const initialOptions = {};
        Object.entries(productData.options).forEach(([key, optionConfig]) => {
          if (optionConfig && typeof optionConfig === 'object') {
            // Handle nested structure: { label, values, default }
            if (optionConfig.values && Array.isArray(optionConfig.values)) {
              initialOptions[key] = optionConfig.default || optionConfig.values[0];
            } else if (Array.isArray(optionConfig)) {
              // Handle simple array structure
              initialOptions[key] = optionConfig[0];
            }
          }
        });
        setSelectedOptions(initialOptions);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get option values - handles both nested and simple structures
  const getOptionValues = (optionConfig) => {
    if (!optionConfig) return [];
    if (Array.isArray(optionConfig)) return optionConfig;
    if (optionConfig.values && Array.isArray(optionConfig.values)) return optionConfig.values;
    return [];
  };

  // Get option label
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

  const handleOptionChange = (optionName, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleTextChange = (field, value) => {
    setCustomText(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) return;

    try {
      setAdding(true);
      const fullOptions = {
        ...selectedOptions,
        customText: customText,
        artworkOption: artworkOption,
      };
      await addToCart(product.id, 1, fullOptions);
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAdding(false);
    }
  };

  const getCategoryImage = (category) => {
    const images = {
      'Marketing Materials': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=600&fit=crop',
      'Signs & Banners': 'https://images.unsplash.com/photo-1563906267088-b029e7101114?w=800&h=600&fit=crop',
      'Apparel & Promo': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
      'Booklets & Guides': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop',
      'Trade Show': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    };
    return images[category] || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=600&fit=crop';
  };

  // Check if product needs text content (print materials)
  const needsTextContent = () => {
    if (!product) return false;
    const printCategories = ['Marketing Materials', 'Signs & Banners', 'Booklets & Guides'];
    return printCategories.includes(product.category);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
        <Link to="/products" className="btn bg-academica-blue text-white hover:bg-academica-blue-600">
          Back to Products
        </Link>
      </div>
    );
  }

  const productImages = product.images?.length > 0 ? product.images : [getCategoryImage(product.category)];
  const hasOptions = product.options && Object.keys(product.options).length > 0;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header Bar */}
      <div className="bg-academica-blue text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="hover:text-academica-gold transition-colors">Home</Link>
            <span className="text-white/50">/</span>
            <Link to="/products" className="hover:text-academica-gold transition-colors">Products</Link>
            <span className="text-white/50">/</span>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-academica-gold transition-colors">
              {product.category}
            </Link>
            <span className="text-white/50">/</span>
            <span className="text-academica-gold">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Product Title Bar */}
        <div className="bg-white rounded-t-lg shadow-sm p-4 border-b">
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal">{product.name}</h1>
            <p className="text-gray-500 mt-1">{product.description}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-0">
          {/* Left Column - Product Image */}
          <div className="bg-white p-6 border-r border-gray-200">
            <div className="sticky top-24">
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {productImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                        selectedImage === idx ? 'border-academica-blue' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-charcoal mb-3">Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-cta-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Configurator */}
          <div className="bg-white p-6 border-r border-gray-200">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('configure')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'configure'
                    ? 'border-academica-blue text-academica-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                1. Configure
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
                  2. Your Content
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
                {needsTextContent() ? '3. Artwork' : '2. Artwork'}
              </button>
            </div>

            {/* Configure Tab */}
            {activeTab === 'configure' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg text-charcoal mb-4">Select Your Options</h2>

                {hasOptions ? (
                  Object.entries(product.options).map(([optionKey, optionConfig]) => {
                    const values = getOptionValues(optionConfig);
                    const label = getOptionLabel(optionKey, optionConfig);

                    if (values.length === 0) return null;

                    return (
                      <div key={optionKey} className="border-b border-gray-100 pb-4">
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          {label}
                        </label>
                        <select
                          value={selectedOptions[optionKey] || values[0]}
                          onChange={(e) => handleOptionChange(optionKey, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent text-sm"
                        >
                          {values.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-sm">No configuration options available for this product.</p>
                )}

                {needsTextContent() && (
                  <button
                    onClick={() => setActiveTab('content')}
                    className="w-full mt-4 py-2 px-4 bg-academica-blue text-white rounded-md hover:bg-academica-blue-600 transition-colors text-sm font-medium"
                  >
                    Next: Add Your Content →
                  </button>
                )}
              </div>
            )}

            {/* Content Tab - Text Input */}
            {activeTab === 'content' && needsTextContent() && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg text-charcoal mb-2">Enter Your Content</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Provide the text you want printed on your {product.name.toLowerCase()}. Our design team will create your proof.
                </p>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Headline / Title
                  </label>
                  <input
                    type="text"
                    value={customText.headline}
                    onChange={(e) => handleTextChange('headline', e.target.value)}
                    placeholder="e.g., Join Our School Today!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Subheadline (Optional)
                  </label>
                  <input
                    type="text"
                    value={customText.subheadline}
                    onChange={(e) => handleTextChange('subheadline', e.target.value)}
                    placeholder="e.g., Now Enrolling for Fall 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Body Text / Description
                  </label>
                  <textarea
                    value={customText.bodyText}
                    onChange={(e) => handleTextChange('bodyText', e.target.value)}
                    placeholder="Enter the main message or description..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Call to Action
                  </label>
                  <input
                    type="text"
                    value={customText.callToAction}
                    onChange={(e) => handleTextChange('callToAction', e.target.value)}
                    placeholder="e.g., Enroll Now!, Learn More, Visit Us"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Contact Information
                  </label>
                  <textarea
                    value={customText.contactInfo}
                    onChange={(e) => handleTextChange('contactInfo', e.target.value)}
                    placeholder="School address, phone, website, email..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">
                    Additional Notes for Designer
                  </label>
                  <textarea
                    value={customText.additionalNotes}
                    onChange={(e) => handleTextChange('additionalNotes', e.target.value)}
                    placeholder="Special instructions, color preferences, layout ideas..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent text-sm"
                  />
                </div>

                <button
                  onClick={() => setActiveTab('artwork')}
                  className="w-full mt-4 py-2 px-4 bg-academica-blue text-white rounded-md hover:bg-academica-blue-600 transition-colors text-sm font-medium"
                >
                  Next: Artwork Options →
                </button>
              </div>
            )}

            {/* Artwork Tab */}
            {activeTab === 'artwork' && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg text-charcoal mb-2">Artwork & Files</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Choose how you'd like to provide your artwork or logo files.
                </p>

                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    artworkOption === 'upload-later' ? 'border-academica-blue bg-academica-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="artwork"
                      value="upload-later"
                      checked={artworkOption === 'upload-later'}
                      onChange={(e) => setArtworkOption(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-charcoal">Upload Files Later</div>
                      <div className="text-sm text-gray-500">We'll send you instructions to upload your logo and images after ordering</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    artworkOption === 'design-service' ? 'border-academica-blue bg-academica-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="artwork"
                      value="design-service"
                      checked={artworkOption === 'design-service'}
                      onChange={(e) => setArtworkOption(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-charcoal">Use Our Design Service</div>
                      <div className="text-sm text-gray-500">Our team will create a custom design based on your content (included)</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    artworkOption === 'use-template' ? 'border-academica-blue bg-academica-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="artwork"
                      value="use-template"
                      checked={artworkOption === 'use-template'}
                      onChange={(e) => setArtworkOption(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-charcoal">Use Academica Template</div>
                      <div className="text-sm text-gray-500">We'll use your school's approved brand template</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    artworkOption === 'print-ready' ? 'border-academica-blue bg-academica-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="artwork"
                      value="print-ready"
                      checked={artworkOption === 'print-ready'}
                      onChange={(e) => setArtworkOption(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-charcoal">I Have Print-Ready Files</div>
                      <div className="text-sm text-gray-500">Upload your own print-ready PDF, AI, or PSD files</div>
                    </div>
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <strong>Proof Approval:</strong> You'll receive a digital proof to review before we print. No printing without your approval!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white p-6">
            <div className="sticky top-24">
              <h2 className="font-semibold text-lg text-charcoal mb-4">Order Summary</h2>

              {/* Selected Options Display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm">
                  {Object.entries(selectedOptions).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500">{getOptionLabel(key, product.options?.[key])}:</span>
                      <span className="text-charcoal font-medium">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Artwork:</span>
                    <span className="text-charcoal font-medium">
                      {artworkOption === 'upload-later' && 'Upload Later'}
                      {artworkOption === 'design-service' && 'Design Service'}
                      {artworkOption === 'use-template' && 'Use Template'}
                      {artworkOption === 'print-ready' && 'Print-Ready Files'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add to Cart */}
              {isAuthenticated ? (
                <button
                  onClick={handleAddToCart}
                  disabled={adding || !product.inStock}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    !product.inStock
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : added
                      ? 'bg-cta-green text-white'
                      : 'bg-cta-green text-white hover:bg-cta-green-hover'
                  }`}
                >
                  {adding ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </span>
                  ) : added ? (
                    <span className="flex items-center justify-center">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added to Cart!
                    </span>
                  ) : !product.inStock ? (
                    'Out of Stock'
                  ) : (
                    'Add to Cart'
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    className="block w-full py-3 px-6 bg-academica-blue text-white rounded-lg font-semibold text-center hover:bg-academica-blue-600 transition-colors"
                  >
                    Sign In to Order
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full py-3 px-6 border border-gray-300 text-charcoal rounded-lg font-medium text-center hover:bg-gray-50 transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
