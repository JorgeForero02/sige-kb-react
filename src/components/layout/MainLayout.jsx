import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './MainLayout.css';

export function MainLayout({ children, title }) {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Header /> 
        <div className="content-wrapper">
          {title && <h1>{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
}