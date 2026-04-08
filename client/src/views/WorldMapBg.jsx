import React, { memo, useState, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Sphere,
  Marker,
  Line,
} from 'react-simple-maps';

/**
 * LiveWorldMap — Premium, cartographically accurate world map with live nodes.
 *
 * Uses react-simple-maps (d3-geo + TopoJSON) for pixel-perfect country borders
 * from Natural Earth 110m dataset. Nodes are rendered as <Marker> components
 * inside the projected SVG so they align perfectly with geography.
 *
 * Props:
 *   nodes        — array of { id, lon, lat, label, featured? }
 *   selectedId   — currently selected node id (or null)
 *   onSelect     — (id | null) => void
 *   getNodeInfo  — (node) => { cluster, zone, time, latency }
 */

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/* ── Connection pairs (node id → node id) ──────────────────────────── */
const CONNECTIONS = [
  ['sf', 'ny'], ['ny', 'lon'], ['lon', 'ber'], ['ber', 'par'],
  ['lon', 'dub'], ['dub', 'mum'], ['mum', 'sin'], ['sin', 'hk'],
  ['hk', 'tok'], ['tok', 'seo'], ['tok', 'syd'], ['chi', 'ny'],
  ['la', 'sf'],
];

/* ── Memoized single-country path ──────────────────────────────────── */
const GeoPath = memo(({ geo }) => (
  <Geography
    geography={geo}
    tabIndex={-1}
    style={{
      default: {
        fill: 'rgba(0, 229, 255, 0.055)',
        stroke: 'rgba(0, 229, 255, 0.13)',
        strokeWidth: 0.35,
        outline: 'none',
      },
      hover: {
        fill: 'rgba(0, 229, 255, 0.09)',
        stroke: 'rgba(0, 229, 255, 0.20)',
        strokeWidth: 0.45,
        outline: 'none',
      },
      pressed: {
        fill: 'rgba(0, 229, 255, 0.09)',
        outline: 'none',
      },
    }}
  />
));

/* ── Main component ────────────────────────────────────────────────── */
function LiveWorldMap({ nodes = [], selectedId, onSelect, getNodeInfo, searchTerm = '' }) {
  const { mapProjection } = useSettings();
  
  const projectionMap = {
    mercator: 'geoMercator',
    orthographic: 'geoOrthographic',
    equirectangular: 'geoEquirectangular',
    equalEarth: 'geoEqualEarth'
  };

  const projection = projectionMap[mapProjection] || 'geoEqualEarth';

  // Specific configs for better framing
  const projectionConfig = useMemo(() => {
    switch (mapProjection) {
      case 'orthographic':
        return { scale: 180, center: [12, 2] };
      case 'mercator':
        return { scale: 100, center: [0, 20] };
      default:
        return { scale: 148, center: [12, 2] };
    }
  }, [mapProjection]);

  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach((n) => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const searchLower = searchTerm.toLowerCase().trim();

  return (
    <div className="livemap">
      {/* Ambient background glow */}
      <div className="livemap__ambient" />

      {/* Animated scan line */}
      <div className="livemap__scanline" />

      <ComposableMap
        projection={projection}
        projectionConfig={projectionConfig}
        width={800}
        height={400}
        className="livemap__svg"
      >
        {/* Earth outline */}
        <Sphere
          stroke="rgba(0, 229, 255, 0.05)"
          strokeWidth={0.4}
          fill="transparent"
        />

        {/* Grid lines */}
        <Graticule
          stroke="rgba(0, 229, 255, 0.025)"
          strokeWidth={0.25}
          step={[20, 20]}
        />

        {/* Country polygons */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => <GeoPath key={geo.rsmKey} geo={geo} />)
          }
        </Geographies>

        {/* ── Connection arcs between nodes ─────────────── */}
        {CONNECTIONS.map(([a, b], i) => {
          const na = nodeMap[a];
          const nb = nodeMap[b];
          if (!na || !nb) return null;
          
          // Dim arcs if search is active and neither node matches
          const isSearchActive = searchLower.length > 0;
          const matchA = na.label?.toLowerCase().includes(searchLower) || na.city?.toLowerCase().includes(searchLower);
          const matchB = nb.label?.toLowerCase().includes(searchLower) || nb.city?.toLowerCase().includes(searchLower);
          const arcOpacity = isSearchActive && !matchA && !matchB ? 0.03 : 0.10;

          return (
            <Line
              key={`conn-${i}`}
              from={[na.lon, na.lat]}
              to={[nb.lon, nb.lat]}
              stroke={`rgba(0, 229, 255, ${arcOpacity})`}
              strokeWidth={0.6}
              strokeLinecap="round"
              strokeDasharray="3 5"
              className="livemap__arc"
            />
          );
        })}

        {/* ── Node markers ─────────────────────────────── */}
        {nodes.map((node) => {
          const isSelected = selectedId === node.id;
          const info = getNodeInfo ? getNodeInfo(node) : null;
          
          // Search matching logic
          const label = node.label || node.city || '';
          const cluster = info?.cluster || '';
          const isMatch = searchLower === '' || 
                         label.toLowerCase().includes(searchLower) || 
                         cluster.toLowerCase().includes(searchLower);
          
          const isActive = (node.featured || isSelected) && isMatch;
          const dimOpacity = isMatch ? 1 : 0.15;

          return (
            <Marker
              key={node.id}
              coordinates={[node.lon, node.lat]}
              onClick={() => onSelect?.(isSelected ? null : node.id)}
              className="livemap__marker"
              style={{ opacity: dimOpacity, transition: 'opacity 0.3s ease' }}
            >
              {/* Outer pulse ring */}
              <circle
                r={isSelected ? 10 : 7}
                fill="none"
                stroke={
                  node.featured
                    ? 'rgba(0, 200, 83, 0.25)'
                    : 'rgba(0, 229, 255, 0.20)'
                }
                strokeWidth={0.5}
                className="livemap__ring"
              />

              {/* Secondary ring for featured/selected */}
              {isActive && (
                <circle
                  r={isSelected ? 15 : 12}
                  fill="none"
                  stroke={
                    isSelected
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(0, 229, 255, 0.08)'
                  }
                  strokeWidth={0.3}
                  className="livemap__ring livemap__ring--outer"
                />
              )}

              {/* Core dot */}
              <circle
                r={isSelected ? 3.5 : node.featured ? 3 : 2.2}
                fill={
                  isSelected
                    ? '#ffffff'
                    : node.featured
                    ? '#00C853'
                    : '#00E5FF'
                }
                stroke={
                  isSelected
                    ? '#00E5FF'
                    : 'rgba(0,0,0,0.3)'
                }
                strokeWidth={isSelected ? 1 : 0.5}
                className="livemap__dot"
                style={{
                  filter: isSelected
                    ? 'drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px #00E5FF)'
                    : node.featured
                    ? 'drop-shadow(0 0 4px rgba(0,200,83,0.6))'
                    : 'drop-shadow(0 0 3px rgba(0,229,255,0.5))',
                }}
              />

              {/* Tooltip */}
              {isActive && info && (
                <g className="livemap__tooltip-wrap">
                  <foreignObject
                    x={-80}
                    y={-72}
                    width={160}
                    height={60}
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                  >
                    <div className="livemap__tooltip" xmlns="http://www.w3.org/1999/xhtml">
                      <span className="livemap__tooltip-cluster">{info.cluster}</span>
                      <strong className="livemap__tooltip-label">{node.label} Node</strong>
                      <div className="livemap__tooltip-meta">
                        <span className="livemap__tooltip-time">{info.time}</span>
                        <span className="livemap__tooltip-latency">{info.latency}ms</span>
                      </div>
                      <div className="livemap__tooltip-coords">
                        {`${Math.abs(node.lat).toFixed(1)}°${node.lat >= 0 ? 'N' : 'S'} ${Math.abs(node.lon).toFixed(1)}°${node.lon >= 0 ? 'E' : 'W'}`}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              )}
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}

export default memo(LiveWorldMap);
