import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { fetchWithAuth } from '../utils/api';
import useAnimationClock from '../hooks/useAnimationClock';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import AddCityModal from '../components/Dashboard/AddCityModal';
import LiveWorldMap from './WorldMapBg';
import './Dashboard.css';

// Data is now fetched dynamically from the backend
const DEFAULT_ZONES = [
    { city: 'San Francisco', zone: 'America/Los_Angeles', workStart: 9, workEnd: 17 },
    { city: 'London', zone: 'Europe/London', workStart: 9, workEnd: 18 },
    { city: 'Berlin', zone: 'Europe/Berlin', workStart: 9, workEnd: 18 },
    { city: 'Singapore', zone: 'Asia/Singapore', workStart: 9, workEnd: 18 },
];

const getZoneForCity = (city) => {
    switch (city) {
        case 'San Francisco': return { cluster: 'AMER CLUSTER', zone: 'America/Los_Angeles' };
        case 'New York': return { cluster: 'AMER CLUSTER', zone: 'America/New_York' };
        case 'Chicago': return { cluster: 'AMER CLUSTER', zone: 'America/Chicago' };
        case 'Los Angeles': return { cluster: 'AMER CLUSTER', zone: 'America/Los_Angeles' };
        case 'London': return { cluster: 'EMEA CLUSTER', zone: 'Europe/London' };
        case 'Berlin': return { cluster: 'EMEA CLUSTER', zone: 'Europe/Berlin' };
        case 'Dubai': return { cluster: 'EMEA CLUSTER', zone: 'Asia/Dubai' };
        case 'Paris': return { cluster: 'EMEA CLUSTER', zone: 'Europe/Paris' };
        case 'Mumbai': return { cluster: 'APAC CLUSTER', zone: 'Asia/Kolkata' };
        case 'Singapore': return { cluster: 'APAC CLUSTER', zone: 'Asia/Singapore' };
        case 'Tokyo': return { cluster: 'APAC CLUSTER', zone: 'Asia/Tokyo' };
        case 'Sydney': return { cluster: 'APAC CLUSTER', zone: 'Australia/Sydney' };
        case 'Hong Kong': return { cluster: 'APAC CLUSTER', zone: 'Asia/Hong_Kong' };
        case 'Seoul': return { cluster: 'APAC CLUSTER', zone: 'Asia/Seoul' };
        default: return { cluster: 'GLOBAL NODE', zone: 'UTC' };
    }
};

const Dashboard = () => {
    const liveClock = useAnimationClock(1000);
    const [scrubOffset, setScrubOffset] = useState(null);
    const [favoriteZones, setFavoriteZones] = useState([]);
    const [overviewData, setOverviewData] = useState(null);
    const [localNodes, setLocalNodes] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPulse, setSelectedPulse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const searchLower = searchTerm?.toLowerCase().trim() || '';
  if (searchTerm) {
    console.log('LiveWorldMap Search:', searchLower);
  }

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetchWithAuth('/api/v1/users/me');
                const data = await res.json();
                if (data.favorites !== undefined && data.favorites !== null) {
                    setFavoriteZones(data.favorites);
                } else {
                    setFavoriteZones(DEFAULT_ZONES);
                }

                const dashRes = await fetchWithAuth('/api/v1/dashboard/overview');
                if (dashRes.ok) {
                    const dashData = await dashRes.json();
                    setOverviewData(dashData);
                    if (dashData.mapNodes) {
                        setLocalNodes(dashData.mapNodes);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch user data:', err);
                setFavoriteZones(DEFAULT_ZONES);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const syncFavorites = async (updatedList) => {
        try {
            await fetchWithAuth('/api/v1/users/me/favorites', {
                method: 'PUT',
                body: JSON.stringify({ favorites: updatedList })
            });
        } catch (err) {
            console.error('Failed to sync favorites:', err);
        }
    };

    const handleAddCity = (newCity) => {
        const updated = [...favoriteZones, newCity];
        setFavoriteZones(updated);
        syncFavorites(updated);
    };

    const handleRemoveCity = (cityToRemove) => {
        const updated = favoriteZones.filter(z => z.city !== cityToRemove.city);
        setFavoriteZones(updated);
        syncFavorites(updated);
    };

    const handleRegionClick = (region) => {
        // Toggle search or set search
        if (searchTerm === region) {
            setSearchTerm('');
        } else {
            setSearchTerm(region);
        }
    };

    const baseTime = scrubOffset !== null
        ? liveClock.startOf('day').plus({ minutes: scrubOffset })
        : liveClock;

    const handleTimeChange = useCallback((totalMinutes) => {
        setScrubOffset(totalMinutes);
    }, []);

    // Display zones (first 4 for compact clock row)
    const displayZones = favoriteZones.slice(0, 4);

    if (loading || !overviewData) {
        return <div className="dashboard-loading">Initializing Intel...</div>;
    }

    const { mapNodes = [], synchronicity = {}, regionalDistribution = [], opsPulse = [] } = overviewData;



    return (
        <motion.div
            className="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <DashboardHeader
                title="Chronex Dashboard"
                timeDisplay={baseTime.toFormat('hh:mm:ss a')}
                searchTerm={searchTerm}
                onSearchChange={(val) => {
                    console.log('Search Change:', val);
                    setSearchTerm(val);
                }}
                onQuickAdd={() => setShowAddModal(true)}
            />

            <div className="dashboard__content">
                {/* ═══ Top Row: Live Nodes + Synchronicity ═══ */}
                <div className="dashboard__top-row">
                    {/* Live Nodes Map */}
                    <div className="dashboard__live-nodes">
                        <div className="dashboard__section-header">
                            <div>
                                <h2 className="dashboard__section-title">Live Nodes</h2>
                                <p className="dashboard__section-sub">Geographical team density across 14 hubs</p>
                            </div>
                            <span className="dashboard__live-badge anim-sync-pulse">
                                <span className="dashboard__live-dot" /> LIVE SYNC
                            </span>
                        </div>

                        <div className="dashboard__map-container">
                            <LiveWorldMap
                                nodes={localNodes}
                                searchTerm={searchTerm}
                                selectedId={selectedNodeId}
                                onSelect={setSelectedNodeId}
                                getNodeInfo={(node) => {
                                    const { cluster, zone } = getZoneForCity(node.label || node.city);
                                    const localTime = baseTime.setZone(zone);
                                    return {
                                        cluster,
                                        zone,
                                        time: localTime.toFormat('HH:mm:ss'),
                                        latency: Math.floor(8 + Math.random() * 25),
                                    };
                                }}
                            />
                        </div>
                    </div>

                    {/* Synchronicity Gauge */}
                    <div className="dashboard__synchronicity">
                        <div className="dashboard__section-header">
                            <div>
                                <h2 className="dashboard__section-title">Synchronicity</h2>
                                <p className="dashboard__section-sub">Active collaboration overlap</p>
                            </div>
                        </div>

                        <div className="dashboard__gauge-container">
                            <svg viewBox="0 0 120 120" className="dashboard__gauge-svg">
                                <circle cx="60" cy="60" r="50" className="dashboard__gauge-bg" />
                                <circle
                                    cx="60" cy="60" r="50"
                                    className="dashboard__gauge-fill"
                                    style={{
                                        strokeDasharray: `${2 * Math.PI * 50}`,
                                        strokeDashoffset: `${2 * Math.PI * 50 * (1 - (synchronicity.index || 0) / 100)}`,
                                    }}
                                />
                            </svg>
                            <div className="dashboard__gauge-label">
                                <span className="dashboard__gauge-value">{synchronicity.index || 0}%</span>
                                <span className="dashboard__gauge-text">INDEX</span>
                            </div>
                        </div>

                        <div className="dashboard__sync-stats">
                            <div className="dashboard__sync-stat">
                                <span className="dashboard__stat-dot" style={{ background: 'var(--color-primary)' }} />
                                <span>Online Now</span>
                                <span className="dashboard__stat-val">{synchronicity.onlineNow || 0}</span>
                            </div>
                            <div className="dashboard__sync-stat">
                                <span className="dashboard__stat-dot" style={{ background: 'var(--color-secondary)' }} />
                                <span>Overlapping</span>
                                <span className="dashboard__stat-val">{synchronicity.overlapping || 0}</span>
                            </div>
                            <div className="dashboard__sync-stat">
                                <span className="dashboard__stat-dot" style={{ background: 'var(--color-text-dim)' }} />
                                <span>Offline/Rest</span>
                                <span className="dashboard__stat-val">{synchronicity.offlineRest || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Clock Cards Row ═══ */}
                <div className="dashboard__clocks-row">
                    {displayZones.map((z, idx) => {
                        let localTime;
                        try {
                            localTime = baseTime.setZone(z.zone);
                            if (!localTime.isValid) throw new Error();
                        } catch {
                            localTime = baseTime;
                        }
                        const utcOffset = localTime.toFormat('ZZ');
                        const isWorking = localTime.hour >= (z.workStart || 9) && localTime.hour < (z.workEnd || 17);

                        return (
                            <div key={`${z.zone}-${idx}`} className="dashboard__clock-card">
                                <div className="dashboard__clock-header">
                                    <span className="dashboard__clock-city">{z.city.toUpperCase()}</span>
                                    <div className="dashboard__clock-actions">
                                        <span className={`dashboard__clock-status ${isWorking ? 'dashboard__clock-status--active' : ''}`}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"/>
                                                <polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                        </span>
                                        <button 
                                            className="dashboard__clock-remove" 
                                            onClick={() => handleRemoveCity(z)}
                                            title="Remove city"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="dashboard__clock-time">
                                    <span className="dashboard__clock-digits">{localTime.toFormat('hh:mm')}</span>
                                    <span className="dashboard__clock-period">{localTime.toFormat('a')}</span>
                                </div>
                                <span className="dashboard__clock-offset">
                                    {z.zone.includes('/') ? z.zone.split('/').pop().replace('_', ' ').substring(0, 3).toUpperCase() : ''} (UTC{utcOffset})
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ═══ Bottom Row: Regional Distribution + Ops Pulse ═══ */}
                <div className="dashboard__bottom-row">
                    {/* Regional Distribution */}
                    <div className="dashboard__regional">
                        <div className="dashboard__section-header">
                            <h3 className="dashboard__section-title-sm">Regional Distribution</h3>
                            <button className="dashboard__view-all" onClick={() => setSearchTerm('')}>View All Clusters</button>
                        </div>
                        <div className="dashboard__region-list">
                            {regionalDistribution.map((r, i) => (
                                <motion.div 
                                    key={i} 
                                    className={`dashboard__region-item ${searchTerm === r.region ? 'dashboard__region-item--active' : ''}`}
                                    onClick={() => handleRegionClick(r.region)}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="dashboard__region-info">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="2" y1="12" x2="22" y2="12"/>
                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                        </svg>
                                        <span>{r.region}</span>
                                    </div>
                                    <span className="dashboard__region-count">{r.members} Members</span>
                                    <div className="dashboard__region-bar">
                                        <div
                                            className="dashboard__region-bar-fill"
                                            style={{ width: `${(r.members / (r.max || 1)) * 100}%`, background: r.color }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Ops Pulse */}
                    <div className="dashboard__ops-pulse">
                        <h3 className="dashboard__section-title-sm">Ops Pulse</h3>
                        <div className="dashboard__ops-list">
                            {opsPulse.map((item, i) => (
                                <motion.div 
                                    key={item.id || i} 
                                    className="dashboard__ops-item"
                                    onClick={() => setSelectedPulse(item)}
                                    whileHover={{ x: 4, background: 'rgba(255,255,255,0.02)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span
                                        className="dashboard__ops-icon"
                                        style={{ color: item.color, borderColor: item.color }}
                                    >
                                        {item.icon}
                                    </span>
                                    <div className="dashboard__ops-info">
                                        <span className="dashboard__ops-title">{item.title}</span>
                                        <span className="dashboard__ops-desc">{item.desc}</span>
                                        <span className="dashboard__ops-time">{item.time}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AddCityModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddCity}
            />

            {/* Pulse Detail Modal */}
            {selectedPulse && (
                <div className="modal-overlay" onClick={() => setSelectedPulse(null)}>
                    <motion.div 
                        className="pulse-modal glass-panel"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="pulse-modal__title-group">
                                <span className="pulse-modal__badge" style={{ borderColor: selectedPulse.color, color: selectedPulse.color }}>
                                    {selectedPulse.icon}
                                </span>
                                <div>
                                    <h3>{selectedPulse.title}</h3>
                                    <p>{selectedPulse.time}</p>
                                </div>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedPulse(null)}>×</button>
                        </div>
                        
                        <div className="pulse-modal__content">
                            <div className="pulse-modal__desc">{selectedPulse.desc}</div>
                            
                            {selectedPulse.details && (
                                <div className="pulse-modal__trace">
                                    <div className="pulse-modal__trace-header">DIAGNOSTIC TRACE</div>
                                    <div className="pulse-modal__trace-grid">
                                        <div className="pulse-modal__trace-item">
                                            <label>Trace ID</label>
                                            <span>{selectedPulse.details.traceId}</span>
                                        </div>
                                        <div className="pulse-modal__trace-item">
                                            <label>Status</label>
                                            <span style={{ color: selectedPulse.color }}>{selectedPulse.details.status}</span>
                                        </div>
                                        <div className="pulse-modal__trace-item">
                                            <label>Nodes</label>
                                            <span>{selectedPulse.details.nodes?.join(' • ')}</span>
                                        </div>
                                        {selectedPulse.details.latency && (
                                            <div className="pulse-modal__trace-item">
                                                <label>Latency</label>
                                                <span>{selectedPulse.details.latency}</span>
                                            </div>
                                        )}
                                        {selectedPulse.details.offset && (
                                            <div className="pulse-modal__trace-item">
                                                <label>Drift Offset</label>
                                                <span style={{ color: 'var(--color-danger)' }}>{selectedPulse.details.offset}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            <div className="pulse-modal__actions">
                                <button className="pulse-modal__btn pulse-modal__btn--primary" onClick={() => setSelectedPulse(null)}>
                                    Acknowledge
                                </button>
                                <button className="pulse-modal__btn" onClick={() => setSelectedPulse(null)}>
                                    View Full Logs
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* FAB */}
            <button className="dashboard__fab" onClick={() => setShowAddModal(true)} title="Add City">
                +
            </button>
        </motion.div>
    );
};

export default Dashboard;
