import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { tools } from '../utils/tools';
import ToolCard from '../components/ToolCard';
import AdPlaceholder from '../components/AdPlaceholder';
import type { ToolCategory } from '../types';

const categoryDisplayInfo: Record<ToolCategory, { name: string; emoji: string }> = {
    AI: { name: 'AI Tools', emoji: '🧠' },
    PDF: { name: 'PDF Tools', emoji: '📄' },
    Student: { name: 'Student Tools', emoji: '🎓' },
    Text: { name: 'Text Tools', emoji: '✍️' },
    Converters: { name: 'Converters', emoji: '🔄' },
    Developer: { name: 'Developer Tools', emoji: '💻' },
    SEO: { name: 'SEO Tools', emoji: '📈' },
    Utility: { name: 'Utility Tools', emoji: '⚙️' },
    Misc: { name: 'Misc Tools', emoji: '📦' },
};

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All');

  const subtitleText = "Unlock your productivity with over 80 powerful, free online tools. From AI magic to PDF mastery, we've got you covered.";

  // Debounce search input
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      setShowResults(true);
    } else {
      setShowResults(false);
    }

    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Handle clicks outside the search bar to close the results menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleResultClick = () => {
    setShowResults(false);
    setSearchQuery('');
  };

  const searchFilteredTools = React.useMemo(() => {
    if (!debouncedQuery.trim()) {
      return [];
    }
    const lowerCaseQuery = debouncedQuery.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(lowerCaseQuery) ||
        tool.description.toLowerCase().includes(lowerCaseQuery) ||
        tool.category.toLowerCase().includes(lowerCaseQuery) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(lowerCaseQuery))
    );
  }, [debouncedQuery]);

  // Tools grouped by category for display
  const toolsByCategory = tools.reduce((acc, tool) => {
    (acc[tool.category] = acc[tool.category] || []).push(tool);
    return acc;
  }, {} as Record<ToolCategory, typeof tools>);

  const categoryOrder: ToolCategory[] = ['AI', 'PDF', 'Student', 'Text', 'Converters', 'Developer', 'SEO', 'Utility', 'Misc'];
  const availableCategories = categoryOrder.filter(cat => toolsByCategory[cat]?.length > 0);

  return (
    <div className="space-y-12">
      <section className="text-center py-16">
        <div className="relative z-10 container mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-brand-text-primary mb-4 text-glow">
              The Ultimate Suite of <span className="text-brand-primary">Online Tools</span>
            </h1>
            <p className="text-lg sm:text-xl text-brand-text-secondary max-w-3xl mx-auto mb-8 min-h-[56px] md:min-h-[84px]">
              {subtitleText}
            </p>
            <div ref={searchContainerRef} className="max-w-xl mx-auto animate-fade-in-up relative" style={{animationDelay: '1.5s'}}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => { if(searchQuery) setShowResults(true); }}
                placeholder="Search for tools like 'json formatter'..."
                className="w-full bg-brand-surface border-2 border-brand-border rounded-full py-3 pl-6 pr-12 text-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 transition-shadow"
              />
              {isSearching && searchQuery && (
                <div className="absolute top-0 right-0 h-full flex items-center pr-5">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-brand-primary"></div>
                </div>
              )}

              {showResults && debouncedQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-border rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                    {!isSearching && searchFilteredTools.length > 0 ? (
                        <ul>
                            {searchFilteredTools.slice(0, 10).map(tool => (
                                <li key={tool.path}>
                                    <Link 
                                      to={tool.path} 
                                      onClick={handleResultClick}
                                      className="block p-4 hover:bg-brand-border transition-colors duration-150"
                                    >
                                        <h4 className="font-semibold text-brand-text-primary">{tool.name}</h4>
                                        <p className="text-sm text-brand-text-secondary truncate">{tool.description}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : !isSearching && (
                        <div className="p-4 text-brand-text-secondary">No tools found for "{debouncedQuery}".</div>
                    )}
                </div>
              )}
            </div>
        </div>
      </section>
      
      <section className="text-center -mt-8 mb-12 animate-fade-in-up" style={{ animationDelay: '1.8s' }}>
        <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-brand-text-secondary">
          <span className="font-semibold">Popular Categories:</span>
          <Link to="/#ai-tools" className="font-semibold text-brand-text-primary hover:text-brand-primary px-3 py-1 bg-brand-surface hover:bg-brand-border rounded-full transition-colors">AI Tools</Link>
          <Link to="/#pdf-tools" className="font-semibold text-brand-text-primary hover:text-brand-primary px-3 py-1 bg-brand-surface hover:bg-brand-border rounded-full transition-colors">PDF Tools</Link>
          <Link to="/#developer-tools" className="font-semibold text-brand-text-primary hover:text-brand-primary px-3 py-1 bg-brand-surface hover:bg-brand-border rounded-full transition-colors">Developer Tools</Link>
          <Link to="/#seo-tools" className="font-semibold text-brand-text-primary hover:text-brand-primary px-3 py-1 bg-brand-surface hover:bg-brand-border rounded-full transition-colors">SEO Tools</Link>
        </div>
      </section>

      <AdPlaceholder className="animate-fade-in-up" style={{ animationDelay: '0.2s' }} />
      
      <nav className="flex flex-wrap justify-center gap-2 md:gap-4 sticky top-[70px] bg-brand-bg/90 backdrop-blur-sm py-4 z-20 rounded-lg">
          <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors text-sm md:text-base ${activeCategory === 'All' ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-border'}`}
          >
              All Tools
          </button>
          {availableCategories.map(category => (
              <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full font-semibold transition-colors flex items-center gap-2 text-sm md:text-base ${activeCategory === category ? 'bg-brand-primary text-white' : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-border'}`}
              >
                  <span>{categoryDisplayInfo[category].emoji}</span>
                  <span>{category}</span>
              </button>
          ))}
      </nav>

      <div className="space-y-12">
        {availableCategories
          .filter(category => activeCategory === 'All' || activeCategory === category)
          .map((category, index) => (
            <section
              key={category}
              id={`${category.toLowerCase()}-tools`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <h2 className="text-3xl font-bold text-brand-text-primary mb-6 border-l-4 border-brand-primary pl-4">
                {categoryDisplayInfo[category].emoji} {categoryDisplayInfo[category].name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {toolsByCategory[category].map((tool) => (
                  <ToolCard key={tool.path} tool={tool} />
                ))}
              </div>
            </section>
        ))}
      </div>
      
      <AdPlaceholder className="animate-fade-in-up" />
    </div>
  );
};

export default HomePage;