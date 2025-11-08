import React from 'react';
import { Sidebar } from './Sidebar';
import './MainLayout.css';

export function MainLayout({ children, title }) {
  return (
    <>
      <Sidebar />
      <main className="main-content">
        {title && <h1>{title}</h1>}
        {children}
      </main>
    </>
  );
}