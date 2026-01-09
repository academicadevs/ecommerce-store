import { Link } from 'react-router-dom';

const categories = [
  { name: 'Marketing Materials', path: 'Marketing Materials' },
  { name: 'Signs & Banners', path: 'Signs & Banners' },
  { name: 'Apparel & Promo', path: 'Apparel & Promo' },
  { name: 'Booklets & Guides', path: 'Booklets & Guides' },
  { name: 'Trade Show', path: 'Trade Show' },
  { name: 'Custom Requests', path: 'Custom Requests' },
];

export default function Footer() {
  return (
    <footer className="bg-academica-blue text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <img src="/logo-white.svg" alt="AcademicaMart" className="h-10 w-auto" />
            </Link>
            <p className="text-white/70 text-sm">
              Your trusted partner for Academica school marketing materials. Quality products to help your school stand out and attract families.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link
                    to={`/products?category=${encodeURIComponent(cat.path)}`}
                    className="text-sm text-white/70 hover:text-academica-gold transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-sm text-white/70 hover:text-academica-gold transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-white/70 hover:text-academica-gold transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-white/70 hover:text-academica-gold transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-sm text-white/70 hover:text-academica-gold transition-colors">
                  Order History
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
