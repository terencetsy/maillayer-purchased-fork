import React, { useState, useEffect } from 'react';
import ContactsBarChart from './ContactsBarChart';

const DailyContactsChart = ({ brandId, listId, days = 30, status = 'all' }) => {
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState(days);

    useEffect(() => {
        const fetchDailyStats = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/daily-stats?days=${timeRange}&status=${status}`, { credentials: 'same-origin' });

                if (!response.ok) {
                    throw new Error('Failed to fetch daily contact stats');
                }

                const data = await response.json();

                // Format data for bar chart
                const formattedData = data.dailyData.map((day) => ({
                    date: day.date,
                    value: day.count,
                }));

                setChartData(formattedData);
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching daily stats:', err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        if (brandId && listId) {
            fetchDailyStats();
        }
    }, [brandId, listId, timeRange, status]);

    const handleTimeRangeChange = (days) => {
        setTimeRange(days);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
                <div style={{ width: '2rem', height: '2rem', border: '3px solid #f0f0f0', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#666' }}>Loading chart data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>Failed to load chart data: {error}</p>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            {/* Time Range Selector */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                    className={`button button--small ${timeRange === 7 ? 'button--primary' : 'button--secondary'}`}
                    onClick={() => handleTimeRangeChange(7)}
                >
                    7 Days
                </button>
                <button
                    className={`button button--small ${timeRange === 30 ? 'button--primary' : 'button--secondary'}`}
                    onClick={() => handleTimeRangeChange(30)}
                >
                    30 Days
                </button>
                <button
                    className={`button button--small ${timeRange === 90 ? 'button--primary' : 'button--secondary'}`}
                    onClick={() => handleTimeRangeChange(90)}
                >
                    90 Days
                </button>
            </div>

            {/* Bar Chart */}
            <ContactsBarChart
                data={chartData}
                title="Daily Contact Activity"
                totalLabel="contacts"
            />
        </div>
    );
};

export default DailyContactsChart;
