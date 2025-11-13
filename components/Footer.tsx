import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-surface mt-12 shadow-inner">
      <div className="container mx-auto px-4 py-6 text-center text-brand-text-secondary text-sm">
        <div className="flex justify-center space-x-4 mb-4">
          <Link to="/privacy-policy" className="hover:text-brand-primary">Privacy Policy</Link>
          <Link to="/contact-us" className="hover:text-brand-primary">Contact Us</Link>
          <Link to="/terms-of-service" className="hover:text-brand-primary">Terms of Service</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} DiceTools. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;