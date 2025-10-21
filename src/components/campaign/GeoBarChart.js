import { useState } from 'react';
import * as flags from 'country-flag-icons/react/3x2';

export default function GeoBarChart({ data = [], title = 'Data', totalLabel = 'Total', type = 'location' }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Country code mapping (you might want to expand this)
    const getCountryCode = (countryName) => {
        const countryMap = {
            'United States': 'US',
            USA: 'US',
            'United Kingdom': 'GB',
            UK: 'GB',
            India: 'IN',
            Canada: 'CA',
            Australia: 'AU',
            Germany: 'DE',
            France: 'FR',
            Japan: 'JP',
            China: 'CN',
            Brazil: 'BR',
            Mexico: 'MX',
            Spain: 'ES',
            Italy: 'IT',
            Netherlands: 'NL',
            Sweden: 'SE',
            Norway: 'NO',
            Denmark: 'DK',
            Finland: 'FI',
            Poland: 'PL',
            Russia: 'RU',
            'South Korea': 'KR',
            Singapore: 'SG',
            'New Zealand': 'NZ',
            Switzerland: 'CH',
            Austria: 'AT',
            Belgium: 'BE',
            Ireland: 'IE',
            Portugal: 'PT',
            Greece: 'GR',
            'Czech Republic': 'CZ',
            Romania: 'RO',
            Hungary: 'HU',
            Turkey: 'TR',
            'South Africa': 'ZA',
            Argentina: 'AR',
            Chile: 'CL',
            Colombia: 'CO',
            Peru: 'PE',
            Thailand: 'TH',
            Vietnam: 'VN',
            Indonesia: 'ID',
            Malaysia: 'MY',
            Philippines: 'PH',
            Pakistan: 'PK',
            Bangladesh: 'BD',
            Egypt: 'EG',
            Nigeria: 'NG',
            Kenya: 'KE',
            'Saudi Arabia': 'SA',
            'United Arab Emirates': 'AE',
            UAE: 'AE',
            Israel: 'IL',
        };
        return countryMap[countryName] || null;
    };

    // Get country flag component
    const CountryFlag = ({ countryName }) => {
        const countryCode = getCountryCode(countryName);
        if (!countryCode) return null;

        const FlagComponent = flags[countryCode];
        if (!FlagComponent) return null;

        return (
            <div style={{ width: '24px', height: '16px', borderRadius: '2px', overflow: 'hidden', border: '1px solid #e5e5e5' }}>
                <FlagComponent style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
        );
    };

    if (!data || data.length === 0) {
        return (
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.25rem' }}>{title}</h3>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', color: '#999', fontSize: '0.875rem', fontStyle: 'italic' }}>No data available</div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map((item) => item.value), 1);
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1a1a1a', marginBottom: '0.25rem' }}>{title}</h3>
                    <span style={{ fontSize: '0.8125rem', color: '#999' }}>{data.length} items</span>
                </div>
                <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '500' }}>
                    {total.toLocaleString()} {totalLabel}
                </span>
            </div>

            {/* Bar Chart */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    gap: '12px',
                    height: '280px',
                    padding: '20px 0',
                    position: 'relative',
                    borderBottom: '1px solid #f0f0f0',
                    overflowX: 'auto',
                    overflowY: 'visible',
                }}
            >
                {data.map((item, index) => {
                    const heightPercentage = (item.value / maxValue) * 100;
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    const isHovered = hoveredIndex === index;

                    return (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                minWidth: '60px',
                                flexShrink: 0,
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Flag (only for countries) */}
                            {type === 'countries' && (
                                <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                    <CountryFlag countryName={item.date} />
                                </div>
                            )}

                            {/* Bar Wrapper */}
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    height: type === 'countries' ? '200px' : '220px',
                                    position: 'relative',
                                }}
                            >
                                {/* Value Label and Percentage */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '2px',
                                        marginBottom: '6px',
                                        opacity: isHovered ? 1 : 0,
                                        transition: 'opacity 0.2s ease',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: '#1a1a1a',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {item.value}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            color: '#666',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {percentage}%
                                    </div>
                                </div>

                                {/* Bar */}
                                <div
                                    style={{
                                        width: '48px',
                                        background: isHovered ? '#f0f0f0' : '#f5f5f5',
                                        borderRadius: '6px 6px 0 0',
                                        position: 'relative',
                                        minHeight: '8px',
                                        height: `${Math.max(heightPercentage, 4)}%`,
                                        transition: 'all 0.3s ease',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Bar Fill */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: '100%',
                                            background: isHovered ? 'linear-gradient(180deg, #1a1a1a 0%, #4a4a4a 100%)' : 'linear-gradient(180deg, #666 0%, #999 100%)',
                                            borderRadius: '6px 6px 0 0',
                                            transition: 'all 0.3s ease',
                                            boxShadow: isHovered ? '0 0 20px rgba(26, 26, 26, 0.3)' : 'none',
                                        }}
                                    ></div>

                                    {/* Percentage inside bar (always visible) */}
                                    {heightPercentage > 15 && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                fontSize: '10px',
                                                fontWeight: '600',
                                                color: isHovered ? '#fff' : 'rgba(255, 255, 255, 0.9)',
                                                whiteSpace: 'nowrap',
                                                zIndex: 1,
                                            }}
                                        >
                                            {percentage}%
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Label (Country/City/Device name) */}
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: '#666',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '70px',
                                    textAlign: 'center',
                                    transform: 'rotate(-45deg)',
                                    transformOrigin: 'center',
                                    marginTop: '20px',
                                }}
                                title={item.date}
                            >
                                {item.date}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
