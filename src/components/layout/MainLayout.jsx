import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './MainLayout.css';

export function MainLayout({ children, title }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="main-layout">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="main-content">
        <Header /> 
        <div className="content-wrapper">
          {!isSidebarOpen && (
            <button 
              className="hamburger content-hamburger" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú lateral"
            >
              <i className="bi bi-list"></i>
            </button>
          )}
          {title && <h1>{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
}