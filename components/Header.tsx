import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DiceLogo from './DiceLogo';

interface HeaderProps {
  animationEnabled: boolean;
  onToggleAnimation: () => void;
  animationAvailable: boolean;
}

const Header: React.FC<HeaderProps> = ({ animationEnabled, onToggleAnimation, animationAvailable }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toolCategories = ['AI', 'PDF', 'Student', 'Text', 'Converters', 'Developer', 'SEO', 'Utility', 'Misc'];
  
  const handleCategoryClick = () => {
    setIsMenuOpen(false); // Close mobile menu
    setIsToolsMenuOpen(false); // Close desktop dropdown
  };

  const CategoryLinks: React.FC<{mobile?: boolean}> = ({ mobile = false }) => (
    <>
      {toolCategories.map(category => (
        <Link 
          key={category}
          to={`/#${category.toLowerCase()}-tools`}
          onClick={handleCategoryClick}
          className={mobile 
            ? "block py-2 px-4 text-sm hover:bg-brand-border" 
            : "block px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-border hover:text-brand-text-primary"}
        >
          {category}
        </Link>
      ))}
    </>
  );

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg bg-brand-surface/90 backdrop-blur-sm' : 'bg-transparent shadow-md'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-brand-primary logo-glow flex items-center gap-2">
            <DiceLogo />
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-4 items-center">
              <Link to="/" className="text-brand-text-secondary hover:text-brand-text-primary px-3 py-2">Home</Link>
              <div 
                className="relative"
                onMouseEnter={() => setIsToolsMenuOpen(true)}
                onMouseLeave={() => setIsToolsMenuOpen(false)}
              >
                <button className="text-brand-text-secondary hover:text-brand-text-primary px-3 py-2 flex items-center">
                  Tools
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-1 transition-transform duration-200 ${isToolsMenuOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                {isToolsMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-brand-surface rounded-md shadow-lg border border-brand-border w-40 animate-fade-in-up" style={{animationDuration: '0.2s'}}>
                    <CategoryLinks />
                  </div>
                )}
              </div>
            </nav>
            {animationAvailable && (
              <button 
                onClick={onToggleAnimation} 
                className="text-brand-text-secondary hover:text-brand-primary p-2"
                title={animationEnabled ? 'Disable Background Animation' : 'Enable Background Animation'}
              >
                {animationEnabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.28 10.46a5.5 5.5 0 0 0-5.74 5.74M10.46 17.28a5.5 5.5 0 0 0 5.74-5.74M14.12 14.12 19.46 19.46M12 2l-2.05 4.1L5.82 7 7 11.14 5.82 17 9.95 18.18 12 22l2.05-4.1L18.18 17 17 12.86 18.18 7l-4.13-1.18L12 2z"></path></svg>
                )}
              </button>
            )}
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-brand-text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col">
               <Link to="/" onClick={() => setIsMenuOpen(false)} className="block py-2 px-4 text-sm hover:bg-brand-border">Home</Link>
               <div className="border-t border-brand-border my-2"></div>
               <span className="px-4 py-1 text-xs font-bold text-brand-text-secondary uppercase">Tool Categories</span>
               <CategoryLinks mobile />
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;