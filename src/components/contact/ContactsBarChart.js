import { useState } from 'react';

export default function ContactsBarChart({ data = [], title = 'Daily Activity', totalLabel = 'Total' }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Aggregate data based on length
    const getAggregatedData = () => {
        if (!data || data.length === 0) return [];

        const dataLength = data.length;

        // For 7-14 days: show daily
        if (dataLength <= 14) {
            return data;
        }

        // For 15-45 days: show daily but limit display
        if (dataLength <= 45) {
            return data;
        }

        // For 46-90 days: aggregate by week
        if (dataLength <= 90) {
            const weeks = [];
            for (let i = 0; i < data.length; i += 7) {
                const weekData = data.slice(i, i + 7);
                const weekTotal = weekData.reduce((sum, day) => sum + day.value, 0);
                const weekStart = weekData[0].date;
                weeks.push({
                    date: weekStart,
                    value: weekTotal,
                    isWeek: true,
                });
            }
            return weeks;
        }

        // For 90+ days: aggregate by 2 weeks
        const biWeeks = [];
        for (let i = 0; i < data.length; i += 14) {
            const biWeekData = data.slice(i, i + 14);
            const biWeekTotal = biWeekData.reduce((sum, day) => sum + day.value, 0);
            const biWeekStart = biWeekData[0].date;
            biWeeks.push({
                date: biWeekStart,
                value: biWeekTotal,
                isBiWeek: true,
            });
        }
        return biWeeks;
    };

    const aggregatedData = getAggregatedData();
    const maxValue = Math.max(...aggregatedData.map((item) => item.value), 1);

    // Check if data contains dates or plain text
    const isDateData = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date) && dateStr.includes('-');
    };

    // Format date or return plain text
    const formatLabel = (dateStr, item) => {
        // If it's not a date (like country, device, browser name), return as is
        if (!isDateData(dateStr)) {
            return dateStr;
        }

        // Otherwise format as date
        const date = new Date(dateStr);
        if (item.isWeek) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        if (item.isBiWeek) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Determine label display
    const shouldShowLabel = (index) => {
        const length = aggregatedData.length;
        if (length <= 14) return true;
        if (length <= 30) return index % 2 === 0;
        return index % 3 === 0;
    };

    // Determine bar max width based on data length
    const getBarMaxWidth = () => {
        if (aggregatedData.length <= 14) return '40px';
        if (aggregatedData.length <= 30) return '32px';
        return '28px';
    };

    if (!data || data.length === 0) {
        return (
            <div className="chart-container">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">{title}</h3>
                    </div>
                </div>
                <div className="chart-empty">No data available</div>
            </div>
        );
    }

    return (
        <div className="chart-container">
            {/* Header */}
            <div className="chart-header">
                <div>
                    <h3 className="chart-title">{title}</h3>
                    <div className="chart-subtitle">
                        {data.length} {isDateData(data[0]?.date) ? 'days' : 'items'}
                        {aggregatedData[0]?.isWeek && ' (weekly)'}
                        {aggregatedData[0]?.isBiWeek && ' (bi-weekly)'}
                    </div>
                </div>
                <span className="chart-total">
                    {total.toLocaleString()} {totalLabel}
                </span>
            </div>

            {/* Bar Chart */}
            <div className="chart-bars">
                {aggregatedData.map((item, index) => {
                    const heightPercentage = (item.value / maxValue) * 100;
                    const isHovered = hoveredIndex === index;

                    return (
                        <div
                            key={index}
                            className="chart-bar-wrapper"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Bar Wrapper */}
                            <div className="chart-bar-inner">
                                {/* Value Label */}
                                <div
                                    className="chart-bar-value"
                                    style={{ opacity: isHovered ? 1 : 0 }}
                                >
                                    {item.value}
                                </div>

                                {/* Bar */}
                                <div
                                    className="chart-bar"
                                    style={{
                                        maxWidth: getBarMaxWidth(),
                                        height: `${Math.max(heightPercentage, 2)}%`,
                                    }}
                                >
                                    {/* Bar Fill */}
                                    <div className="chart-bar-fill"></div>
                                </div>
                            </div>

                            {/* Label */}
                            <div
                                className="chart-bar-label"
                                style={{ visibility: shouldShowLabel(index) ? 'visible' : 'hidden' }}
                                title={formatLabel(item.date, item)}
                            >
                                {formatLabel(item.date, item)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
