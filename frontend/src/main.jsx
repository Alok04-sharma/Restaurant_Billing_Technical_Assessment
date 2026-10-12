/**
 * Path: frontend/src/main.jsx
 * Responsibility: Bootstrap React, Router-based application and Tailwind global stylesheet.
 * Integration: frontend/index.html #root, App.jsx and index.css.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
