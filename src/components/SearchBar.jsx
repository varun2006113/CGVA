import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import { detectInputType, getDetectionLabel } from '../utils/inputDetection';

export default function SearchBar({ onSearch, initialQuery = '', className = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [detectedType, setDetectedType] = useState('UNKNOWN');

  useEffect(() => {
    setQuery(initialQuery);
    setDetectedType(detectInputType(initialQuery));
  }, [initialQuery]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setDetectedType(detectInputType(val));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim(), detectedType);
    }
  };

  const handleSelectExample = (exampleVal) => {
    setQuery(exampleVal);
    const type = detectInputType(exampleVal);
    setDetectedType(type);
    if (onSearch) {
      onSearch(exampleVal, type);
    }
  };

  return (
    <div className={`w-full max-w-3xl ${className}`}>
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center bg-white border border-slate-300 rounded-lg shadow-sm focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
          <div className="pl-4 pr-2 text-slate-400">
            <Search className="w-5 h-5 text-slate-500" />
          </div>

          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search Gene symbol (TP53, BRCA1), rsID (rs28934578), or HGVS notation..."
            className="w-full py-3.5 pl-1 pr-36 text-slate-900 text-sm font-sans placeholder-slate-400 focus:outline-none bg-transparent"
          />

          {/* Auto Detection Badge */}
          {detectedType !== 'UNKNOWN' && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-medium text-cyan-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
              <span>{getDetectionLabel(detectedType)}</span>
            </div>
          )}

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-cyan-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Example Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="font-medium text-slate-500">Examples:</span>
        <button
          type="button"
          onClick={() => handleSelectExample('BRCA1')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-cyan-500 hover:text-cyan-800 font-mono transition-colors"
        >
          BRCA1 <span className="text-[10px] text-slate-400">(Gene)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectExample('TP53')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-cyan-500 hover:text-cyan-800 font-mono transition-colors"
        >
          TP53 <span className="text-[10px] text-slate-400">(Gene)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectExample('rs28934578')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-cyan-500 hover:text-cyan-800 font-mono transition-colors"
        >
          rs28934578 <span className="text-[10px] text-slate-400">(rsID)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectExample('NM_000546.6:c.524G>A')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-cyan-500 hover:text-cyan-800 font-mono transition-colors"
        >
          NM_000546.6:c.524G&gt;A <span className="text-[10px] text-slate-400">(HGVS coding)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectExample('NP_000537.3:p.Arg175His')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-cyan-500 hover:text-cyan-800 font-mono transition-colors"
        >
          NP_000537.3:p.Arg175His <span className="text-[10px] text-slate-400">(HGVS protein)</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectExample('NC_000017.11:g.7675088C>T')}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-cyan-500 hover:text-cyan-800 font-mono transition-colors"
        >
          NC_000017.11:g.7675088C&gt;T <span className="text-[10px] text-slate-400">(HGVS genomic)</span>
        </button>
      </div>
    </div>
  );
}
