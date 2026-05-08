import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, Loader } from 'lucide-react';
import api from '../../api/axios';

const SellerAutocomplete = ({ value, onChange, onSelect }) => {
    const [query, setQuery] = useState(value?.username || '');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    const fetchSuggestions = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 1) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/seller/search?query=${encodeURIComponent(searchQuery)}`);
            setSuggestions(response.data.data || []);
            setSelectedIndex(-1);
        } catch (error) {
            console.error('Error fetching sellers:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuggestions(query);
            if (query) setIsOpen(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, fetchSuggestions]);

    const handleSelect = (seller) => {
        setQuery(seller.username);
        setSuggestions([]);
        setIsOpen(false);
        if (onSelect) {
            onSelect(seller);
        }
        if (onChange) {
            onChange(seller);
        }
    };

    const handleKeyDown = (e) => {
        if (!isOpen || suggestions.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    const handleClickOutside = (e) => {
        if (inputRef.current && !inputRef.current.contains(e.target) &&
            suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && setIsOpen(true)}
                    placeholder="Satıcı adını yazın..."
                    style={{
                        width: '100%',
                        paddingRight: '30px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        padding: '8px 10px',
                        fontSize: '14px',
                        fontFamily: 'inherit'
                    }}
                />
                {loading && (
                    <Loader
                        size={16}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            animation: 'spin 1s linear infinite'
                        }}
                    />
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--bg-light)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        marginTop: '4px',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    {suggestions.map((seller, index) => (
                        <div
                            key={seller.id}
                            onClick={() => handleSelect(seller)}
                            style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                backgroundColor: index === selectedIndex ? 'var(--primary-light)' : 'transparent',
                                borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                                transition: 'background-color 0.2s',
                                ':hover': { backgroundColor: 'var(--primary-light)' }
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                                {seller.username}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && query && suggestions.length === 0 && !loading && (
                <div
                    ref={suggestionsRef}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--bg-light)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        marginTop: '4px',
                        padding: '12px',
                        zIndex: 1000,
                        textAlign: 'center',
                        color: 'var(--text-light)',
                        fontSize: '13px'
                    }}
                >
                    Satıcı tapılmadı
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SellerAutocomplete;
