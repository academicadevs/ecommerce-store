import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import NotificationBell from './NotificationBell';

const productCategories = [
  {
    name: 'Marketing Materials',
    subcategories: ['Flyers', 'Postcards', 'Brochures', 'Business Cards', 'Posters', 'Direct Mail', 'Enrollment Materials', 'Folders']
  },
  {
    name: 'Signs & Banners',
    subcategories: ['Banners', 'Banner Stands', 'Yard Signs', 'A-Frame Signs']
  },
  {
    name: 'Apparel & Promo',
    subcategories: ['T-Shirts', 'Bags', 'Writing Instruments', 'Drinkware', 'Lanyards']
  },
  {
    name: 'Trade Show',
    subcategories: ['Table Displays', 'Backdrops', 'Flags']
  },
  {
    name: 'Digital Products',
    subcategories: ['Presentation Templates', 'Social Media Templates', 'Document Templates', 'Digital Signage']
  },
];

const navLinks = [
  { name: 'Quick Request', link: '/quick-request' },
  { name: 'Custom Requests', link: '/custom-request' },
  { name: 'Digital Ad Campaign', link: '/meta-ads' },
  { name: 'Website Requests', link: '/website-request' },
];

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-academica-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-10 text-sm">
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="hidden sm:inline text-white/70">
                    Welcome, {user?.contactName?.split(' ')[0] || user?.schoolName}
                  </span>
                  <button onClick={handleLogout} className="hover:text-academica-gold transition-colors">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-academica-gold transition-colors">
                    Sign In
                  </Link>
                  <Link to="/register" className="hover:text-academica-gold transition-colors">
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img src="/logo.svg" alt="AcademicaMart" className="h-10 w-auto" />
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products (e.g., flyers, banners, t-shirts)"
                  className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-academica-blue focus:border-transparent"
                />
                <button className="absolute right-0 top-0 h-full px-4 bg-academica-blue text-white rounded-r hover:bg-academica-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {isAdmin && (
                <>
                  <div className="hidden sm:flex">
                    <NotificationBell />
                  </div>
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1 text-charcoal hover:text-academica-blue transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">Admin</span>
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <>
                  <Link
                    to="/profile"
                    className="hidden sm:flex items-center gap-1 text-charcoal hover:text-academica-blue transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium">Profile</span>
                  </Link>
                  <Link
                    to={isAdmin ? "/admin/orders" : "/orders"}
                    className="hidden sm:flex items-center gap-1 text-charcoal hover:text-academica-blue transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm font-medium">Requests</span>
                  </Link>
                </>
              )}

              {/* Cart */}
              <Link
                to={isAuthenticated ? "/cart" : "/login"}
                className="flex items-center gap-2 text-charcoal hover:text-academica-blue transition-colors"
              >
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {isAuthenticated && itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-terracotta text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-charcoal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="hidden md:block bg-[#C1272D] text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {/* Products Mega Menu Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setActiveMenu('products')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <Link
                to="/products"
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeMenu === 'products' ? 'bg-academica-blue' : 'hover:bg-[#a82227]'
                }`}
              >
                Products
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>

              {/* Mega Menu Dropdown */}
              {activeMenu === 'products' && (
                <div className="absolute left-0 top-full bg-white shadow-xl border border-gray-200 rounded-b-xl z-50 w-[700px]">
                  <div className="grid grid-cols-3 gap-x-6 gap-y-8 p-6">
                    {productCategories.map((category) => (
                      <div key={category.name}>
                        <Link
                          to={`/products?category=${encodeURIComponent(category.name)}`}
                          className="text-sm font-semibold text-charcoal hover:text-academica-blue transition-colors"
                        >
                          {category.name}
                        </Link>
                        <ul className="mt-2 space-y-1">
                          {category.subcategories.map((sub) => (
                            <li key={sub}>
                              <Link
                                to={`/products?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(sub)}`}
                                className="block text-sm text-gray-500 hover:text-academica-blue transition-colors"
                              >
                                {sub}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 rounded-b-xl">
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-1 text-sm font-medium text-academica-blue hover:text-academica-blue-600 transition-colors"
                    >
                      View All Products
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Standalone Nav Links */}
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.link}
                className="px-4 py-3 text-sm font-medium transition-colors hover:bg-[#a82227]"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {/* Search */}
            <div className="py-2">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded"
              />
            </div>

            {/* Products (expandable) */}
            <div className="py-2 border-t border-gray-100">
              <button
                onClick={() => setActiveMenu(activeMenu === 'mobile-products' ? null : 'mobile-products')}
                className="flex items-center justify-between w-full font-medium text-charcoal py-1"
              >
                Products
                <svg className={`w-4 h-4 transition-transform ${activeMenu === 'mobile-products' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeMenu === 'mobile-products' && (
                <div className="mt-2 space-y-3 pl-2">
                  {productCategories.map((category) => (
                    <div key={category.name}>
                      <Link
                        to={`/products?category=${encodeURIComponent(category.name)}`}
                        className="block text-sm font-semibold text-charcoal py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                      <div className="pl-3 space-y-1">
                        {category.subcategories.map((sub) => (
                          <Link
                            key={sub}
                            to={`/products?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(sub)}`}
                            className="block text-sm text-gray-500 py-1"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/products"
                    className="block text-sm font-medium text-academica-blue py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    View All Products
                  </Link>
                </div>
              )}
            </div>

            {/* Standalone Nav Links */}
            {navLinks.map((item) => (
              <div key={item.name} className="py-2 border-t border-gray-100">
                <Link
                  to={item.link}
                  className="block font-medium text-charcoal py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </div>
            ))}

            {/* Mobile Auth Links */}
            {isAuthenticated ? (
              <div className="py-2 border-t border-gray-100 space-y-2">
                <Link
                  to="/profile"
                  className="block text-charcoal py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  to={isAdmin ? "/admin/orders" : "/orders"}
                  className="block text-charcoal py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isAdmin ? 'Manage Requests' : 'My Requests'}
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className="block text-charcoal py-1"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/notifications"
                      className="block text-charcoal py-1"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Notifications
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
