import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const categoryData = {
  'Marketing Materials': ['Flyers', 'Postcards', 'Brochures', 'Business Cards', 'Posters'],
  'Signs & Banners': ['Banners', 'Banner Stands', 'Yard Signs', 'A-Frame Signs'],
  'Apparel & Promo': ['T-Shirts', 'Bags', 'Writing Instruments', 'Drinkware', 'Lanyards'],
  'Booklets & Guides': ['Enrollment Materials', 'Folders'],
  'Trade Show': ['Table Displays', 'Backdrops', 'Flags'],
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories] = useState(Object.keys(categoryData));
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  const selectedCategory = searchParams.get('category') || '';
  const selectedSubcategory = searchParams.get('subcategory') || '';

  useEffect(() => {
    // Expand the selected category on load
    if (selectedCategory) {
      setExpandedCategories(prev => ({ ...prev, [selectedCategory]: true }));
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedSubcategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedSubcategory) params.subcategory = selectedSubcategory;
      if (searchTerm) params.search = searchTerm;

      const response = await productsAPI.getAll(params);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    if (category) {
      setSearchParams({ category });
      setExpandedCategories(prev => ({ ...prev, [category]: true }));
    } else {
      setSearchParams({});
    }
  };

  const handleSubcategoryChange = (category, subcategory) => {
    setSearchParams({ category, subcategory });
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-academica-blue transition-colors">Home</Link>
          <span className="text-gray-400">/</span>
          <Link to="/products" className="hover:text-academica-blue transition-colors">Products</Link>
          {selectedCategory && (
            <>
              <span className="text-gray-400">/</span>
              <Link
                to={`/products?category=${encodeURIComponent(selectedCategory)}`}
                className="hover:text-academica-blue transition-colors"
              >
                {selectedCategory}
              </Link>
            </>
          )}
          {selectedSubcategory && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-charcoal font-medium">{selectedSubcategory}</span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal">
            {selectedSubcategory || selectedCategory || 'All Products'}
          </h1>
          <p className="text-gray-600 mt-2">
            {selectedCategory
              ? `Browse our selection of ${selectedCategory.toLowerCase()} for your charter school.`
              : 'Browse our complete selection of marketing materials for charter schools.'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-academica-blue transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-charcoal mb-3">Categories</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      !selectedCategory
                        ? 'bg-academica-blue-50 text-academica-blue font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category}>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleCategoryChange(category)}
                        className={`flex-grow text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                          selectedCategory === category && !selectedSubcategory
                            ? 'bg-academica-blue-50 text-academica-blue font-medium'
                            : selectedCategory === category
                            ? 'text-academica-blue font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {category}
                      </button>
                      <button
                        onClick={() => toggleCategory(category)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${expandedCategories[category] ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {/* Subcategories */}
                    {expandedCategories[category] && categoryData[category] && (
                      <ul className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                        {categoryData[category].map((sub) => (
                          <li key={sub}>
                            <button
                              onClick={() => handleSubcategoryChange(category, sub)}
                              className={`w-full text-left px-2 py-1.5 rounded transition-colors text-sm ${
                                selectedSubcategory === sub
                                  ? 'bg-academica-blue-50 text-academica-blue font-medium'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {sub}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Box */}
            <div className="mt-6 bg-academica-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-academica-blue flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-charcoal text-sm">Need Help?</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Call us at{' '}
                    <a href="tel:888-555-0123" className="text-academica-blue font-medium">
                      888-555-0123
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-medium text-charcoal mb-1">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filter to find what you're looking for.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSearchParams({});
                  }}
                  className="text-academica-blue font-medium hover:text-academica-blue-600 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600">
                    {products.length} {products.length === 1 ? 'product' : 'products'} found
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
