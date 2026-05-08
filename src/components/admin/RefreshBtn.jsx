import React, { useState } from 'react';
import './RefreshBtn.css';

const RefreshBtn = ({ onClick }) => {
    const [spinning, setSpinning] = useState(false);

    const handleClick = async () => {
        if (spinning) return;
        setSpinning(true);
        try {
            await Promise.resolve(onClick());
        } finally {
            setTimeout(() => setSpinning(false), 600);
        }
    };

    return (
        <button
            className={`refresh-fab ${spinning ? 'spinning' : ''}`}
            onClick={handleClick}
            title="Yenilə"
            aria-label="Yenilə"
        >
            <svg
                className="refresh-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
            </svg>
            <span className="refresh-ripple" />
        </button>
    );
};

export default RefreshBtn;
