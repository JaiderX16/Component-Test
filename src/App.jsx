import React, { useState, useEffect, Suspense } from 'react';
import { Search, Box, Smartphone, Tablet, Monitor, RefreshCw, XCircle, Menu, X } from 'lucide-react';
import ErrorBoundary from './components/Playground/ErrorBoundary';

// Dynamic component discovery
const componentFiles = import.meta.glob('./playground-components/*.jsx');

function App() {
  const [components, setComponents] = useState([]);
  const [selectedComponentName, setSelectedComponentName] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('auto'); // auto, mobile, tablet, desktop
  const [CurrentComponent, setCurrentComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const names = Object.keys(componentFiles).map(path => {
      const fileName = path.split('/').pop();
      return fileName.replace('.jsx', '');
    });
    setComponents(names);
  }, []);

  useEffect(() => {
    if (selectedComponentName) {
      loadComponent(selectedComponentName);
    }
  }, [selectedComponentName]);

  const loadComponent = async (name) => {
    setLoading(true);
    try {
      const path = `./playground-components/${name}.jsx`;
      const module = await componentFiles[path]();
      setCurrentComponent(() => module.default);
    } catch (error) {
      console.error("Failed to load component:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComponents = components.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '1280px';
      default: return '100%';
    }
  };

  const handleComponentSelect = (name) => {
    setSelectedComponentName(name);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="playground-layout">
      {/* Hamburger Menu Button (Mobile/Tablet only) */}
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay (Mobile/Tablet only) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>⚡ Playground</h1>
          <button
            className="close-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="component-list">
          {filteredComponents.map(name => (
            <button
              key={name}
              className={`component-item ${selectedComponentName === name ? 'active' : ''}`}
              onClick={() => handleComponentSelect(name)}
            >
              <Box size={18} />
              {name}
            </button>
          ))}
          {filteredComponents.length === 0 && (
            <div style={{ padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              No components found in <code>src/playground-components</code>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="current-info">
            <span style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
              Preview: <strong>{selectedComponentName || 'Select a component'}</strong>
            </span>
          </div>

          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'auto' ? 'active' : ''}`}
              onClick={() => setViewMode('auto')}
              title="Auto"
            >
              Auto
            </button>
            <button
              className={`view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewMode('mobile')}
              title="Mobile"
            >
              <Smartphone size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'tablet' ? 'active' : ''}`}
              onClick={() => setViewMode('tablet')}
              title="Tablet"
            >
              <Tablet size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewMode('desktop')}
              title="Desktop"
            >
              <Monitor size={16} />
            </button>
          </div>
        </header>

        <section className="preview-container">
          <div
            className="preview-wrapper"
            style={{
              width: getPreviewWidth(),
              backgroundColor: selectedComponentName ? 'white' : 'transparent',
              padding: selectedComponentName ? 'clamp(12px, 3vw, 20px)' : '0'
            }}
          >
            <ErrorBoundary key={selectedComponentName}>
              <Suspense fallback={<div className="empty-state"><RefreshCw className="animate-spin" /> Loading...</div>}>
                {CurrentComponent ? (
                  <CurrentComponent />
                ) : (
                  <div className="empty-state">
                    <Box size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h2>Select a component to preview</h2>
                    <p>Drop your JSX files into <code>src/playground-components</code></p>
                  </div>
                )}
              </Suspense>
            </ErrorBoundary>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
