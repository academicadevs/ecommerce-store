import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const getCategoryImage = (category) => {
    const images = {
      'Marketing Materials': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=300&fit=crop',
      'Signs & Banners': 'https://images.unsplash.com/photo-1563906267088-b029e7101114?w=400&h=300&fit=crop',
      'Apparel & Promo': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
      'Booklets & Guides': 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop',
      'Trade Show': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    };
    return images[category] || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=300&fit=crop';
  };

  // Get primary image: first from images array, then imageUrl, then category fallback
  const getPrimaryImage = () => {
    if (product.images?.length > 0) {
      const firstImage = product.images[0];
      // Handle both string URLs and object format
      return typeof firstImage === 'string' ? firstImage : firstImage?.url;
    }
    return product.imageUrl || getCategoryImage(product.category);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={getPrimaryImage()}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium bg-academica-blue text-white px-2 py-1 rounded">
            {product.subcategory || product.category}
          </span>
        </div>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-academica-blue bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-academica-blue px-4 py-2 rounded-lg font-medium shadow-lg">
            View Details
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-charcoal group-hover:text-academica-blue transition-colors line-clamp-1 mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.description}
        </p>

        {/* Features Preview */}
        {product.features && product.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {product.features.slice(0, 2).map((feature, idx) => (
                <span key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                  {feature.length > 25 ? feature.substring(0, 25) + '...' : feature}
                </span>
              ))}
              {product.features.length > 2 && (
                <span className="text-xs text-academica-blue">
                  +{product.features.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
