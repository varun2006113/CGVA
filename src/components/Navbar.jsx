import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Dna, Activity, BarChart2, GitCompare, Info, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeClass = "flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-cyan-800 bg-cyan-50 border-b-2 border-cyan-700 transition-colors rounded-t";
  const inactiveClass = "flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors rounded";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-cyan-400 flex items-center justify-center font-bold shadow-2xs group-hover:bg-cyan-800 transition-colors shrink-0">
              <Dna className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight font-sans">
                  Cancer Genomic Variant Explorer
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 hidden md:inline-block">
                  CGVE v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans hidden sm:block">
                Interactive Evidence Integration Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" end className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <span>Home</span>
            </NavLink>
            <NavLink to="/gene" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <Dna className="w-4 h-4 text-cyan-700" />
              <span>Gene Explorer</span>
            </NavLink>
            <NavLink to="/variant" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <Activity className="w-4 h-4 text-cyan-700" />
              <span>Variant Explorer</span>
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <BarChart2 className="w-4 h-4 text-cyan-700" />
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/compare" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <GitCompare className="w-4 h-4 text-cyan-700" />
              <span>Comparison</span>
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <Info className="w-4 h-4 text-slate-500" />
              <span>About / Methodology</span>
            </NavLink>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-md">
          <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <span>Home</span>
          </NavLink>
          <NavLink to="/gene" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <Dna className="w-4 h-4 text-cyan-700" />
            <span>Gene Explorer</span>
          </NavLink>
          <NavLink to="/variant" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <Activity className="w-4 h-4 text-cyan-700" />
            <span>Variant Explorer</span>
          </NavLink>
          <NavLink to="/analytics" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <BarChart2 className="w-4 h-4 text-cyan-700" />
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/compare" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <GitCompare className="w-4 h-4 text-cyan-700" />
            <span>Comparison</span>
          </NavLink>
          <NavLink to="/about" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>
            <Info className="w-4 h-4 text-slate-500" />
            <span>About / Methodology</span>
          </NavLink>
        </div>
      )}
    </header>
  );
}
