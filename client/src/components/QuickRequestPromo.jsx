import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

const DISMISSED_KEY = 'quickRequestPromoDismissed';

const HIDDEN_PATHS = ['/quick-request', '/login', '/register'];

export default function QuickRequestPromo() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // Don't show on certain pages
    if (HIDDEN_PATHS.includes(pathname) || pathname.startsWith('/admin')) return;

    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Hide when navigating to excluded pages
  useEffect(() => {
    if (HIDDEN_PATHS.includes(pathname) || pathname.startsWith('/admin')) {
      setVisible(false);
    }
  }, [pathname]);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 promo-slide-up">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 w-80 relative">
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-academica-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="pr-4">
            <h3 className="font-semibold text-charcoal text-sm">Need something custom?</h3>
            <p className="text-gray-500 text-sm mt-1">
              Submit a request in less than <span className="font-medium text-charcoal">90 seconds</span> — no account needed.
            </p>
          </div>
        </div>

        <Link
          to="/quick-request"
          onClick={handleDismiss}
          className="btn btn-primary w-full mt-4 py-2.5 text-sm"
        >
          Try Quick Request
          <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
