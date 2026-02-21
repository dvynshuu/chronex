import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AddCityModal.css';

const CITY_DATABASE = [
    { city: 'London', zone: 'Europe/London', country: 'UK' },
    { city: 'New York', zone: 'America/New_York', country: 'USA' },
    { city: 'Tokyo', zone: 'Asia/Tokyo', country: 'Japan' },
    { city: 'Singapore', zone: 'Asia/Singapore', country: 'Singapore' },
    { city: 'Dubai', zone: 'Asia/Dubai', country: 'UAE' },
    { city: 'Paris', zone: 'Europe/Paris', country: 'France' },
    { city: 'Berlin', zone: 'Europe/Berlin', country: 'Germany' },
    { city: 'Mumbai', zone: 'Asia/Kolkata', country: 'India' },
    { city: 'Sydney', zone: 'Australia/Sydney', country: 'Australia' },
    { city: 'San Francisco', zone: 'America/Los_Angeles', country: 'USA' },
    { city: 'Los Angeles', zone: 'America/Los_Angeles', country: 'USA' },
    { city: 'Chicago', zone: 'America/Chicago', country: 'USA' },
    { city: 'Toronto', zone: 'America/Toronto', country: 'Canada' },
    { city: 'Hong Kong', zone: 'Asia/Hong_Kong', country: 'China' },
    { city: 'Seoul', zone: 'Asia/Seoul', country: 'South Korea' },
    { city: 'Sao Paulo', zone: 'America/Sao_Paulo', country: 'Brazil' },
    { city: 'Mexico City', zone: 'America/Mexico_City', country: 'Mexico' },
    { city: 'Cairo', zone: 'Africa/Cairo', country: 'Egypt' },
    { city: 'Bangkok', zone: 'Asia/Bangkok', country: 'Thailand' },
    { city: 'Istanbul', zone: 'Europe/Istanbul', country: 'Turkey' },
    { city: 'Amsterdam', zone: 'Europe/Amsterdam', country: 'Netherlands' },
    { city: 'Zurich', zone: 'Europe/Zurich', country: 'Switzerland' },
    { city: 'Stockholm', zone: 'Europe/Stockholm', country: 'Sweden' },
    { city: 'Moscow', zone: 'Europe/Moscow', country: 'Russia' },
    { city: 'Riyadh', zone: 'Asia/Riyadh', country: 'Saudi Arabia' },
    { city: 'Johannesburg', zone: 'Africa/Johannesburg', country: 'South Africa' },
    { city: 'Buenos Aires', zone: 'America/Argentina/Buenos_Aires', country: 'Argentina' },
];

const AddCityModal = ({ isOpen, onClose, onAdd }) => {
    const [search, setSearch] = useState('');

    const filteredCities = useMemo(() => {
        if (!search) return [];
        const term = search.toLowerCase();
        return CITY_DATABASE.filter(c =>
            c.city.toLowerCase().includes(term) ||
            c.country.toLowerCase().includes(term)
        ).slice(0, 10);
    }, [search]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="add-city-modal glass-panel"
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2>Add Timezone</h2>
                        <button className="modal-close" onClick={onClose}>×</button>
                    </div>

                    <div className="modal-search">
                        <input
                            type="text"
                            className="modal-search__input"
                            placeholder="Search for a city or country..."
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <span className="modal-search__icon">🔍</span>
                    </div>

                    <div className="modal-results">
                        {filteredCities.length > 0 ? (
                            filteredCities.map((city, idx) => (
                                <button
                                    key={idx}
                                    className="modal-result-card"
                                    onClick={() => {
                                        onAdd({ ...city, workStart: 9, workEnd: 17 });
                                        onClose();
                                        setSearch('');
                                    }}
                                >
                                    <div className="modal-result-info">
                                        <span className="modal-result-city">{city.city}</span>
                                        <span className="modal-result-country">{city.country}</span>
                                    </div>
                                    <span className="modal-result-zone">{city.zone}</span>
                                </button>
                            ))
                        ) : search ? (
                            <div className="modal-empty-state">No cities found matching "{search}"</div>
                        ) : (
                            <div className="modal-empty-state">Start typing to find cities...</div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddCityModal;
