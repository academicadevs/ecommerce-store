import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const categories = [
  {
    name: 'Marketing Materials',
    description: 'Flyers, postcards, brochures, business cards, and posters',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=300&fit=crop',
    subcategories: ['Flyers', 'Postcards', 'Brochures', 'Business Cards', 'Posters'],
  },
  {
    name: 'Signs & Banners',
    description: 'Vinyl banners, banner stands, yard signs, and A-frame signs',
    image: 'https://images.unsplash.com/photo-1563906267088-b029e7101114?w=400&h=300&fit=crop',
    subcategories: ['Banners', 'Banner Stands', 'Yard Signs', 'A-Frame Signs'],
  },
  {
    name: 'Apparel & Promo',
    description: 'T-shirts, bags, pens, drinkware, and lanyards',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    subcategories: ['T-Shirts', 'Bags', 'Writing Instruments', 'Drinkware', 'Lanyards'],
  },
  {
    name: 'Booklets & Guides',
    description: 'Enrollment materials, presentation folders, and guides',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop',
    subcategories: ['Enrollment Materials', 'Folders'],
  },
  {
    name: 'Trade Show',
    description: 'Table displays, backdrops, and promotional flags',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
    subcategories: ['Table Displays', 'Backdrops', 'Flags'],
  },
  {
    name: 'Custom Requests',
    description: 'Special projects, unique designs, and custom marketing solutions',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
    subcategories: ['Custom Design', 'Special Projects', 'Rush Orders', 'Other'],
    link: '/custom-request',
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-academica-blue via-academica-blue-600 to-sapphire text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your School's Marketing Starts Here
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              The official ordering portal for the Academica Design Department. Browse our catalog or submit a quick request — we'll handle the rest.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Path 1: Browse the Catalog */}
            <Link
              to="/products"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-8 transition-all hover:scale-[1.02] text-left"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">I Know What I Need</h2>
              <p className="text-white/70 mb-6">
                Browse our full catalog of print materials, signage, apparel, promo items, and more. Pick exactly what you want and customize your order.
              </p>
              <span className="inline-flex items-center gap-2 text-white font-semibold group-hover:gap-3 transition-all">
                Browse Products
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>

            {/* Path 2: Quick Request */}
            <Link
              to="/quick-request"
              className="group bg-white hover:bg-gray-50 rounded-2xl p-8 transition-all hover:scale-[1.02] text-left shadow-lg"
            >
              <div className="w-12 h-12 bg-academica-blue-50 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Just Get It Done</h2>
              <p className="text-gray-600 mb-6">
                Not sure exactly what you need? Tell us about your project and we'll figure out the details. Fast, easy, and no catalog browsing required.
              </p>
              <span className="inline-flex items-center gap-2 text-academica-blue font-semibold group-hover:gap-3 transition-all">
                Submit a Request
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-academica-blue-50 rounded-full mb-6">
              <svg className="w-8 h-8 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-charcoal mb-4">Welcome to the Academica Design Department</h2>
            <p className="text-gray-600 text-lg mb-6">
              This is the official ordering portal for marketing materials from the Academica Design Department.
              We've created this streamlined system to better serve your school's marketing needs and ensure
              every request is handled efficiently.
            </p>
            <div className="bg-academica-blue-50 rounded-xl p-6 text-left">
              <h3 className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How It Works
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-academica-blue">1.</span>
                  Browse our catalog and select the materials your school needs
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-academica-blue">2.</span>
                  Customize your order with the appropriate options and quantities
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-academica-blue">3.</span>
                  Submit your request and our team will process it promptly
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-academica-blue">4.</span>
                  You'll receive a quote and timeline for your order
                </li>
              </ul>
              <p className="mt-4 text-sm text-gray-500 border-t border-academica-blue-100 pt-4">
                Please note: All orders are subject to standard Academica purchasing procedures.
                This portal replaces our previous request methods to provide you with a more
                organized and trackable ordering experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-charcoal mb-4">Shop by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to market your school effectively, from print materials to promotional items.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.link || `/products?category=${encodeURIComponent(category.name)}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {category.name}
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {category.subcategories.slice(0, 3).map((sub) => (
                      <span key={sub} className="text-xs bg-academica-blue-50 text-academica-blue px-2 py-1 rounded">
                        {sub}
                      </span>
                    ))}
                    {category.subcategories.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{category.subcategories.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-academica-blue font-semibold hover:text-academica-blue-600 transition-colors"
            >
              View All Products
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#C1272D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Elevate Your School's Marketing?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Create an account and start ordering today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-academica-blue font-semibold px-8 py-4 rounded-lg transition-all"
                >
                  Start Shopping
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-academica-blue font-semibold px-8 py-4 rounded-lg transition-all"
                  >
                    Create Your Account
                  </Link>
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg border border-white/20 transition-all"
                  >
                    Browse Products
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
