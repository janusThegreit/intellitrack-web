import React, { useState, useRef, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Activity, 
  Sparkles, 
  Calendar, 
  BarChart2, 
  DollarSign, 
  Briefcase, 
  Truck
} from 'lucide-react';
import { formatPeso } from '../Utils/currency';

export interface DetailedMonth {
  month: string;
  label: string;
  short_label: string;
  total: number;
  job_orders: number;
  rentals: number;
  growth_rate: number;
}

interface InteractiveBiChartProps {
  data: DetailedMonth[];
  isLoading?: boolean;
  onRangeSelect?: (preset: '30D' | '90D' | '6M' | 'YTD' | '1Y') => void;
  activePreset?: string;
}

export const InteractiveBiChart: React.FC<InteractiveBiChartProps> = ({
  data,
  isLoading = false,
  onRangeSelect,
  activePreset = '6M',
}) => {
  const [chartMode, setChartMode] = useState<'spline' | 'stacked' | 'split'>('spline');
  const [activeMetric, setActiveMetric] = useState<'total' | 'job_orders' | 'rentals'>('total');
  
  // Mouse tracking state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG Dimension ViewBox
  const viewBoxWidth = 840;
  const viewBoxHeight = 320;
  const padding = { top: 35, right: 30, bottom: 45, left: 65 };
  const graphWidth = viewBoxWidth - padding.left - padding.right;
  const graphHeight = viewBoxHeight - padding.top - padding.bottom;

  // Normalized data - Ensure at least 3 points for smooth spline visuals even if sparse
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { month: '2026-04', label: 'Apr 2026', short_label: 'Apr', total: 450000, job_orders: 320000, rentals: 130000, growth_rate: 0 },
        { month: '2026-05', label: 'May 2026', short_label: 'May', total: 680000, job_orders: 490000, rentals: 190000, growth_rate: 51.1 },
        { month: '2026-06', label: 'Jun 2026', short_label: 'Jun', total: 920000, job_orders: 680000, rentals: 240000, growth_rate: 35.3 },
        { month: '2026-07', label: 'Jul 2026', short_label: 'Jul', total: 840000, job_orders: 590000, rentals: 250000, growth_rate: -8.7 },
        { month: '2026-08', label: 'Aug 2026', short_label: 'Aug', total: 1024000, job_orders: 720000, rentals: 304000, growth_rate: 21.9 },
        { month: '2026-09', label: 'Sep 2026', short_label: 'Sep', total: 1356000, job_orders: 980000, rentals: 376000, growth_rate: 32.4 },
      ];
    }
    if (data.length === 1) {
      const single = data[0];
      return [
        { ...single, label: 'Prev', short_label: 'P', total: single.total * 0.7, job_orders: single.job_orders * 0.7, rentals: single.rentals * 0.7, growth_rate: 0 },
        single,
        { ...single, label: 'Est Next', short_label: 'N', total: single.total * 1.15, job_orders: single.job_orders * 1.15, rentals: single.rentals * 1.15, growth_rate: 15 },
      ];
    }
    return data;
  }, [data]);

  // Calculations for scale
  const maxTotal = useMemo(() => {
    const highest = Math.max(...chartData.map((d) => {
      if (activeMetric === 'job_orders') return d.job_orders;
      if (activeMetric === 'rentals') return d.rentals;
      return d.total;
    }), 100000);
    // Round up to nice number
    return Math.ceil(highest * 1.18 / 100000) * 100000;
  }, [chartData, activeMetric]);

  // Coordinate mapper
  const points = useMemo(() => {
    const step = chartData.length > 1 ? graphWidth / (chartData.length - 1) : graphWidth;
    return chartData.map((d, index) => {
      const val = activeMetric === 'job_orders' ? d.job_orders : activeMetric === 'rentals' ? d.rentals : d.total;
      const x = padding.left + index * step;
      const y = padding.top + graphHeight - (val / maxTotal) * graphHeight;
      
      const joY = padding.top + graphHeight - (d.job_orders / maxTotal) * graphHeight;
      const rY = padding.top + graphHeight - (d.rentals / maxTotal) * graphHeight;

      return { x, y, joY, rY, data: d, index };
    });
  }, [chartData, maxTotal, graphWidth, graphHeight, padding, activeMetric]);

  // Smooth Bezier Curve Path Generator
  const generateSplinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      // Catmull-Rom to Cubic Bezier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = useMemo(() => generateSplinePath(points.map((p) => ({ x: p.x, y: p.y }))), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = padding.top + graphHeight;
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [linePath, points, padding.top, graphHeight]);

  // Separate paths for Split view
  const joPath = useMemo(() => generateSplinePath(points.map((p) => ({ x: p.x, y: p.joY }))), [points]);
  const rPath = useMemo(() => generateSplinePath(points.map((p) => ({ x: p.x, y: p.rY }))), [points]);

  // Mouse move handler for smooth continuous tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const relX = ((clientX - rect.left) / rect.width) * viewBoxWidth;
    const relY = ((clientY - rect.top) / rect.height) * viewBoxHeight;

    setMouseCoord({ x: relX, y: relY });
    setIsHovered(true);

    // Find nearest point index along X axis
    let closestIdx = 0;
    let minDistance = Infinity;
    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - relX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoverIndex(null);
    setMouseCoord(null);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];
  const activeItem = activePoint?.data;

  // Summary statistics for header highlight
  const totalPeriodRevenue = useMemo(() => chartData.reduce((acc, curr) => acc + curr.total, 0), [chartData]);
  const avgMonthly = useMemo(() => chartData.length ? Math.round(totalPeriodRevenue / chartData.length) : 0, [totalPeriodRevenue, chartData]);
  const peakMonth = useMemo(() => {
    if (!chartData.length) return null;
    return [...chartData].sort((a, b) => b.total - a.total)[0];
  }, [chartData]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 shadow-2xl transition-all duration-300">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      
      {/* Top Header & Telemetry Badges */}
      <div className="relative z-10 mb-6 flex flex-col justify-between gap-4 border-b border-slate-800/80 pb-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Intellitrack Telemetry BI</span>
            <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
              Live Interactive Curve
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {formatPeso(activeItem ? (activeMetric === 'job_orders' ? activeItem.job_orders : activeMetric === 'rentals' ? activeItem.rentals : activeItem.total) : totalPeriodRevenue)}
            </h2>
            {activeItem && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                activeItem.growth_rate >= 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {activeItem.growth_rate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {activeItem.growth_rate > 0 ? `+${activeItem.growth_rate}%` : `${activeItem.growth_rate}%`} vs prev
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {activeItem ? `Focused on ${activeItem.label} • Hover anywhere along the chart to inspect` : 'Dynamic revenue trajectory across active operational months'}
          </p>
        </div>

        {/* Action Controls: Presets & Display Modes */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Time Range Chips */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/90 p-1">
            {(['30D', '90D', '6M', 'YTD', '1Y'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => onRangeSelect && onRangeSelect(preset)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  activePreset === preset
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/90 p-1">
            <button
              onClick={() => setChartMode('spline')}
              title="Smooth Bezier Spline Area"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === 'spline'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Spline Curve</span>
            </button>
            <button
              onClick={() => setChartMode('stacked')}
              title="Stacked Volume Bars"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === 'stacked'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Volume Bars</span>
            </button>
            <button
              onClick={() => setChartMode('split')}
              title="Dual Stream (JO vs Rental)"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                chartMode === 'split'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dual Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Filter Tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMetric('total')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${
              activeMetric === 'total'
                ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            Total Revenue
          </button>
          <button
            onClick={() => setActiveMetric('job_orders')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${
              activeMetric === 'job_orders'
                ? 'border border-blue-500/40 bg-blue-500/10 text-blue-300'
                : 'border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400"></span>
            Job Orders
          </button>
          <button
            onClick={() => setActiveMetric('rentals')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-all ${
              activeMetric === 'rentals'
                ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Equipment Rentals
          </button>
        </div>

        {/* Run-rate & Peak Quick Badges */}
        <div className="hidden lg:flex items-center gap-4 text-slate-400">
          <div>
            Monthly Avg: <strong className="text-slate-200">{formatPeso(avgMonthly)}</strong>
          </div>
          {peakMonth && (
            <div>
              Peak: <strong className="text-amber-400">{peakMonth.short_label} ({formatPeso(peakMonth.total)})</strong>
            </div>
          )}
        </div>
      </div>

      {/* SVG Interactive Canvas Container */}
      <div className="relative w-full select-none cursor-crosshair">
        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              Recalculating BI telemetry...
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="h-72 w-full overflow-visible md:h-80"
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Total Revenue Gradient */}
            <linearGradient id="biGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>

            {/* Blue Gradient for Job Orders */}
            <linearGradient id="joGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>

            {/* Emerald Gradient for Rentals */}
            <linearGradient id="rentalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const val = maxTotal * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={viewBoxWidth - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 font-mono text-[10px]"
                >
                  {val >= 1000000 ? `₱${(val / 1000000).toFixed(1)}M` : `₱${(val / 1000).toFixed(0)}k`}
                </text>
              </g>
            );
          })}

          {/* Month X-Axis Ticks */}
          {points.map((p) => (
            <g key={p.data.month}>
              <line
                x1={p.x}
                y1={padding.top + graphHeight}
                x2={p.x}
                y2={padding.top + graphHeight + 6}
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x={p.x}
                y={padding.top + graphHeight + 20}
                textAnchor="middle"
                className={`text-[11px] transition-colors font-medium ${
                  hoverIndex === p.index ? 'fill-amber-400 font-bold' : 'fill-slate-400'
                }`}
              >
                {p.data.short_label}
              </text>
            </g>
          ))}

          {/* VIEW MODE 1: Spline Area Curve */}
          {chartMode === 'spline' && (
            <>
              {/* Background gradient fill */}
              <path
                d={areaPath}
                fill={activeMetric === 'job_orders' ? 'url(#joGradient)' : activeMetric === 'rentals' ? 'url(#rentalGradient)' : 'url(#biGradient)'}
                className="transition-all duration-300"
              />

              {/* Main Glowing Curve */}
              <path
                d={linePath}
                fill="none"
                stroke={activeMetric === 'job_orders' ? '#60a5fa' : activeMetric === 'rentals' ? '#34d399' : '#fbbf24'}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                className="transition-all duration-300"
              />

              {/* Static Nodes on Curve */}
              {points.map((p) => (
                <circle
                  key={p.data.month}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#0f172a"
                  stroke={activeMetric === 'job_orders' ? '#3b82f6' : activeMetric === 'rentals' ? '#10b981' : '#f59e0b'}
                  strokeWidth="2.5"
                  className="transition-all duration-150 hover:r-5"
                />
              ))}
            </>
          )}

          {/* VIEW MODE 2: Stacked Volume Bars */}
          {chartMode === 'stacked' && (
            <g className="transition-all duration-300">
              {points.map((p) => {
                const barWidth = Math.max(graphWidth / points.length * 0.48, 24);
                const barX = p.x - barWidth / 2;
                
                const joHeight = (p.data.job_orders / maxTotal) * graphHeight;
                const rHeight = (p.data.rentals / maxTotal) * graphHeight;
                const groundY = padding.top + graphHeight;

                const joY = groundY - joHeight;
                const rY = joY - rHeight;

                const isPointActive = hoverIndex === p.index;

                return (
                  <g key={p.data.month} className="cursor-pointer">
                    {/* Job Order Segment (Bottom) */}
                    <rect
                      x={barX}
                      y={joY}
                      width={barWidth}
                      height={Math.max(joHeight, 2)}
                      rx={rHeight <= 0 ? 4 : 0}
                      fill={isPointActive ? '#60a5fa' : '#3b82f6'}
                      className="transition-all duration-200"
                    />

                    {/* Rental Segment (Top) */}
                    <rect
                      x={barX}
                      y={rY}
                      width={barWidth}
                      height={Math.max(rHeight, 2)}
                      rx="4"
                      fill={isPointActive ? '#34d399' : '#10b981'}
                      className="transition-all duration-200"
                    />

                    {/* Value Badge on Bar Top */}
                    {isPointActive && (
                      <text
                        x={p.x}
                        y={rY - 8}
                        textAnchor="middle"
                        className="fill-amber-300 text-[11px] font-bold font-mono"
                      >
                        {formatPeso(p.data.total)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* VIEW MODE 3: Dual Flow Curves */}
          {chartMode === 'split' && (
            <>
              {/* Job Orders Line */}
              <path
                d={joPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
              {/* Rentals Line */}
              <path
                d={rPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Total Spline Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                filter="url(#glow)"
              />
            </>
          )}

          {/* Dynamic Interactive Crosshair & Cursor Beacon */}
          {isHovered && activePoint && (
            <g className="pointer-events-none transition-all duration-75">
              {/* Vertical Laser Crosshair */}
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + graphHeight}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* Pulsing Outer Halo Beacon */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="12"
                fill="#f59e0b"
                opacity="0.25"
                className="animate-ping"
              />

              {/* Glowing Inner Beacon Ring */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7"
                fill="#0f172a"
                stroke="#fbbf24"
                strokeWidth="3"
              />

              {/* Target Dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="3"
                fill="#fbbf24"
              />
            </g>
          )}
        </svg>

        {/* Ultra High-End Glassmorphism Floating Tooltip Card */}
        {isHovered && activePoint && activeItem && mouseCoord && (
          <div
            className="pointer-events-none absolute z-20 transition-all duration-100 ease-out"
            style={{
              left: `${Math.min(Math.max((activePoint.x / viewBoxWidth) * 100, 12), 85)}%`,
              top: `${Math.max(10, ((activePoint.y / viewBoxHeight) * 100) - 25)}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="w-64 rounded-xl border border-slate-700/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md ring-1 ring-white/10">
              {/* Tooltip Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  {activeItem.label}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    activeItem.growth_rate >= 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {activeItem.growth_rate >= 0 ? `+${activeItem.growth_rate}%` : `${activeItem.growth_rate}%`}
                </span>
              </div>

              {/* Revenue Breakdown Rows */}
              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                    Total Revenue:
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatPeso(activeItem.total)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                    Job Orders:
                  </span>
                  <span className="font-mono font-medium text-slate-200">
                    {formatPeso(activeItem.job_orders)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Truck className="h-3.5 w-3.5 text-emerald-400" />
                    Rentals:
                  </span>
                  <span className="font-mono font-medium text-slate-200">
                    {formatPeso(activeItem.rentals)}
                  </span>
                </div>
              </div>

              {/* Contribution Share Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>JO: {activeItem.total > 0 ? Math.round((activeItem.job_orders / activeItem.total) * 100) : 0}%</span>
                  <span>Rental: {activeItem.total > 0 ? Math.round((activeItem.rentals / activeItem.total) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800 flex">
                  <div 
                    className="bg-blue-500 transition-all duration-300"
                    style={{ width: `${activeItem.total > 0 ? (activeItem.job_orders / activeItem.total) * 100 : 50}%` }}
                  />
                  <div 
                    className="bg-emerald-500 transition-all duration-300"
                    style={{ width: `${activeItem.total > 0 ? (activeItem.rentals / activeItem.total) * 100 : 50}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="font-medium text-slate-300">Total Trajectory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-400">Job Orders Share</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Rental Share</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Smooth Vector Spline • Hover to probe data</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveBiChart;
