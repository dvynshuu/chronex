import React from 'react';

const Logo = ({ size = 32, color = 'var(--color-primary)', glow = true }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="chronex-logo"
            style={{
                filter: glow ? `drop-shadow(0 0 8px ${color})` : 'none'
            }}
        >
            {/* Background Circle */}
            <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="2" strokeDasharray="10 5" opacity="0.3" />

            {/* Main Stylized 'C' */}
            <path
                d="M75 30C70 20 60 15 50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C60 85 70 80 75 70"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
            />

            {/* Inner Clock Hands Motif */}
            <line x1="50" y1="50" x2="50" y2="30" stroke={color} strokeWidth="6" strokeLinecap="round" />
            <line x1="50" y1="50" x2="65" y2="50" stroke={color} strokeWidth="6" strokeLinecap="round" />

            {/* Pulse Point */}
            <circle cx="50" cy="50" r="4" fill={color} />
        </svg>
    );
};

export default Logo;
