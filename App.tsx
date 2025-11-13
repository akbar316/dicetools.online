import React, { Suspense, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ThreeBackground from './components/ThreeBackground';
import { tools } from './utils/tools';
import useLocalStorage from './hooks/useLocalStorage';
import { isWebGLAvailable } from './utils/webgl';

// Lazy load legal pages
const PrivacyPolicy = React.lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/legal/TermsOfService'));
const ContactUs = React.lazy(() => import('./pages/legal/ContactUs'));


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
  </div>
);

const ScrollToAnchor: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // Use a timeout to ensure the element is rendered before scrolling
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      // Scroll to top on new page navigation without a hash
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return null;
};


const App: React.FC = () => {
  // Enable animations by default only on larger screens to reduce mobile CPU/JS work.
  const defaultAnimation = typeof window !== 'undefined' ? window.innerWidth > 768 : false;
  const [animationEnabled, setAnimationEnabled] = useLocalStorage('animationEnabled', defaultAnimation);
  // Perform the WebGL check once on initial render and store the result in state.
  const [animationAvailable, setAnimationAvailable] = React.useState(() => isWebGLAvailable());
  
  const handleToggleAnimation = () => {
    setAnimationEnabled((prev: boolean) => !prev);
  }
  
  // This callback now serves as a secondary fallback if the renderer fails to initialize
  // even after the initial check passes.
  const handleAnimationError = useCallback(() => {
    if (animationAvailable) {
        console.warn("Disabling 3D background due to an unexpected initialization error.");
        setAnimationAvailable(false);
        setAnimationEnabled(false);
    }
  }, [animationAvailable, setAnimationEnabled]);

  useEffect(() => {
    const injectSchema = async () => {
        try {
            const response = await fetch('./metadata.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const metadata = await response.json();

            // @ts-ignore
            if (metadata.schema && !document.getElementById('schema-markup')) {
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.id = 'schema-markup';
                // @ts-ignore
                script.innerHTML = JSON.stringify(metadata.schema);
                document.head.appendChild(script);
            }
        } catch (error) {
            console.error("Failed to load and inject schema markup:", error);
        }
    };

    injectSchema();
  }, []);

  return (
    <HashRouter>
      <ScrollToAnchor />
      {animationEnabled && animationAvailable && <ThreeBackground onInitError={handleAnimationError} />}
      <div className="flex flex-col min-h-screen relative z-10">
        <Header 
          animationEnabled={animationEnabled} 
          onToggleAnimation={handleToggleAnimation}
          animationAvailable={animationAvailable}
        />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {tools.map((tool) => (
                <Route
                  key={tool.path}
                  path={tool.path}
                  element={<tool.component />}
                />
              ))}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/contact-us" element={<ContactUs />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;