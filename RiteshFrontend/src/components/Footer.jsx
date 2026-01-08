import React from 'react';
import LogozPng from '../assets/Logoz.png';

const Footer = ({ onAboutUsClick, onContactUsClick }) => {
  const footerLinks = {
    company: [
      { name: 'About Us', href: '#', clickable: true, onClick: onAboutUsClick },
      { name: 'Careers', href: '#', clickable: false },
      { name: 'Press', href: '#', clickable: false },
      { name: 'Contact', href: '#', clickable: true, onClick: onContactUsClick }
    ],
    trading: [
      { name: 'Forex Trading', href: '#', clickable: false },
      { name: 'Crypto Trading', href: '#', clickable: false },
      { name: 'Commodities', href: '#', clickable: false },
      { name: 'Indices', href: '#', clickable: false }
    ],
    platform: [
      { name: 'MT5 Platform', href: '#', clickable: false },
      { name: 'Web Terminal', href: '#', clickable: false },
      { name: 'Mobile App', href: '#', clickable: false },
      { name: 'API Access', href: '#', clickable: false }
    ],
    support: [
      { name: 'Help Center', href: '#', clickable: false },
      { name: 'Live Chat', href: '#', clickable: false },
      { name: 'Video Tutorials', href: '#', clickable: false },
      { name: 'FAQ', href: '#', clickable: false }
    ]
  };

  const socialLinks = [
    {
      name: 'Twitter (X)',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      href: '#',
      clickable: false
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      href: '#',
      clickable: false
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      href: '#',
      clickable: false
    },
    {
      name: 'Instagram',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      href: '#',
      clickable: false
    }
  ];

  return (
    <footer className="bg-gradient-to-br from-teal-800 to-purple-900 text-white">
      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2 lg:col-span-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-6">
              <img src={LogozPng} alt="Zerofx.club" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">
              Experience the future of forex trading with cutting-edge technology, 
              ultra-competitive spreads, and unwavering support that grows with you.
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              {socialLinks.map((social, index) => (
                <div
                  key={index}
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center cursor-not-allowed opacity-50"
                  title={`${social.name} (Coming Soon)`}
                >
                  {social.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  {link.clickable ? (
                    <button 
                      onClick={link.onClick}
                      className="text-white/80 hover:text-white transition-colors cursor-pointer"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <span className="text-white/50 cursor-not-allowed">
                      {link.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-4">Trading</h4>
            <ul className="space-y-3">
              {footerLinks.trading.map((link, index) => (
                <li key={index}>
                  <span className="text-white/50 cursor-not-allowed">
                    {link.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, index) => (
                <li key={index}>
                  <span className="text-white/50 cursor-not-allowed">
                    {link.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/20">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-white/80 text-sm">
              <p>© 2025 Zerofx.club. All rights reserved.</p>
              <p className="mt-1">Regulated by Financial Services Authority</p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-white/50 cursor-not-allowed">
                Privacy Policy
              </span>
              <span className="text-white/50 cursor-not-allowed">
                Terms of Service
              </span>
              <span className="text-white/50 cursor-not-allowed">
                Risk Disclosure
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="bg-white/10">
        <div className="container-custom py-6">
          <div className="bg-white/10 rounded-xl p-6">
            <h4 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">⚠️</span>
              Risk Warning
            </h4>
            <p className="text-white/80 text-sm leading-relaxed">
              Trading in financial markets involves significant risks and may not be suitable for all investors. 
              The high degree of leverage can work against you as well as for you. Before deciding to trade 
              foreign exchange or any other financial instrument, you should carefully consider your investment 
              objectives, level of experience, and risk appetite. The possibility exists that you could sustain 
              a loss of some or all of your initial investment and therefore you should not invest money that 
              you cannot afford to lose.
            </p>
          </div>
        </div>
      </div>

      {/* Developer Credit */}
      <div className="border-t border-white/20 bg-gradient-to-r from-teal-900/50 to-purple-900/50">
        <div className="container-custom py-4">
          <div className="text-center">
            <p className='text-sm'>© 2025 Zerofx.club. All rights reserved.</p>
              <p className="mt-1 text-sm">Regulated by Financial Services Authority</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
