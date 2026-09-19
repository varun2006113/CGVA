import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DisclaimerBanner from './components/DisclaimerBanner';
import ErrorBoundary from './components/ErrorBoundary';

import HomePage from './pages/HomePage';
import GeneExplorerPage from './pages/GeneExplorerPage';
import VariantExplorerPage from './pages/VariantExplorerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ComparisonPage from './pages/ComparisonPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gene" element={<GeneExplorerPage />} />
            <Route path="/gene/:symbol" element={<GeneExplorerPage />} />
            <Route path="/variant" element={<VariantExplorerPage />} />
            <Route path="/variant/*" element={<VariantExplorerPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/analytics/:symbol" element={<AnalyticsPage />} />
            <Route path="/compare" element={<ComparisonPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <DisclaimerBanner />
      </div>
    </ErrorBoundary>
  );
}
