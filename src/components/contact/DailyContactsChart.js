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
            <div className="chart-loading">
                <div className="spinner"></div>
                <p>Loading chart data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="chart-error">
                <p>Failed to load chart data: {error}</p>
            </div>
        );
    }

    return (
        <div className="chart-wrapper">
            {/* Time Range Selector */}
            <div className="chart-time-selector">
                <button
                    className={`chart-time-btn ${timeRange === 7 ? 'active' : ''}`}
                    onClick={() => handleTimeRangeChange(7)}
                >
                    7 Days
                </button>
                <button
                    className={`chart-time-btn ${timeRange === 30 ? 'active' : ''}`}
                    onClick={() => handleTimeRangeChange(30)}
                >
                    30 Days
                </button>
                <button
                    className={`chart-time-btn ${timeRange === 90 ? 'active' : ''}`}
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
