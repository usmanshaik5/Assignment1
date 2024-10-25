import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Fixed order for cities
const cityOrder = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];

// Helper function to normalize city names
const normalizeCityName = (city) => {
    return city === 'Bengaluru' ? 'Bangalore' : city;
};

const WeatherMonitor = () => {
    const [weatherData, setWeatherData] = useState([]);
    const [latestUpdates, setLatestUpdates] = useState([]);
    const [dailySummaries, setDailySummaries] = useState([]);
    const [historicalTrends, setHistoricalTrends] = useState([]);
    const [forecasts, setForecasts] = useState([]);
    const [alert, setAlert] = useState('');
    const [unit, setUnit] = useState(localStorage.getItem('temperatureUnit') || 'C');
    const [threshold, setThreshold] = useState(35);
    const [simulationDays, setSimulationDays] = useState(5);

    // Function to fetch weather data
    const fetchWeatherData = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/weather");
            console.log("Weather data received:", response.data);

            const normalizedData = response.data.map(item => ({
                ...item,
                city: normalizeCityName(item.city),
                timestamp: new Date().toLocaleString() // Add timestamp
            }));

            // Only update with new data
            const newData = normalizedData.filter(newItem =>
                !weatherData.some(existingItem => existingItem.city === newItem.city && existingItem.dt === newItem.dt)
            );

            // Sort and update the latest per city
            const latestPerCity = cityOrder.map(city => newData.find(item => item.city === city)).filter(Boolean);

            setLatestUpdates(latestPerCity);
            const updatedWeatherData = [...newData, ...weatherData].sort((a, b) => cityOrder.indexOf(a.city) - cityOrder.indexOf(b.city));
            setWeatherData(updatedWeatherData);

            updateDailySummary(updatedWeatherData);
            updateHistoricalTrends(updatedWeatherData);
            checkAlerts(newData);
        } catch (error) {
            console.error("Error fetching weather data:", error);
            setLatestUpdates([]);
        }
    };

    const fetchWeatherForecasts = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/forecast");
            console.log("Forecast data received:", response.data);

            const normalizedForecasts = response.data.map(item => ({
                city: normalizeCityName(item.city),
                temp: item.temp,
                condition: item.condition || 'No data available',
                timestamp: new Date().toLocaleString() // Add timestamp
            }));

            setForecasts(normalizedForecasts);
        } catch (error) {
            console.error("Error fetching weather forecasts:", error);
            setForecasts([]);
        }
    };

    // Simulate weather updates for demo purposes, with controlled intervals
    const simulateWeatherUpdates = () => {
        const simulatedData = [];
        const currentDate = Math.floor(Date.now() / 1000);

        for (let day = 0; day < simulationDays; day++) {
            cityOrder.forEach(city => {
                const randomTemp = Math.floor(Math.random() * 50);
                const randomFeelsLike = randomTemp + Math.floor(Math.random() * 5);
                const randomHumidity = Math.floor(Math.random() * 100);
                const randomWindSpeed = (Math.random() * 20).toFixed(1);
                const weatherConditions = ['Clear', 'Cloudy', 'Rain', 'Storm', 'Fog'];
                const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

                simulatedData.push({
                    city,
                    temp: randomTemp,
                    feels_like: randomFeelsLike,
                    humidity: randomHumidity,
                    wind_speed: randomWindSpeed,
                    main: randomCondition,
                    dt: currentDate - (day * 86400),
                    timestamp: new Date().toLocaleString() // Add timestamp
                });
            });
        }

        // Simulate updates only once, to avoid frequent re-rendering
        setWeatherData(prevData => [...simulatedData, ...prevData]);
        updateDailySummary([...simulatedData, ...weatherData]);
        updateHistoricalTrends([...simulatedData, ...weatherData]);
        checkAlerts(simulatedData);
    };

    const updateDailySummary = (data) => {
        const dailyData = cityOrder.map(city => {
            const cityData = data.filter(item => item.city === city);

            if (!cityData.length) {
                return {
                    city,
                    avgTemp: 'No data available',
                    maxTemp: 'No data available',
                    minTemp: 'No data available',
                    avgHumidity: 'No data available',
                    avgWindSpeed: 'No data available',
                    dominantCondition: 'No data available',
                };
            }

            const avgTemp = (cityData.reduce((sum, item) => sum + item.temp, 0) / cityData.length).toFixed(2);
            const maxTemp = Math.max(...cityData.map(item => item.temp)).toFixed(2);
            const minTemp = Math.min(...cityData.map(item => item.temp)).toFixed(2);
            const avgHumidity = (cityData.reduce((sum, item) => sum + item.humidity, 0) / cityData.length).toFixed(2);
            const avgWindSpeed = (cityData.reduce((sum, item) => sum + parseFloat(item.wind_speed), 0) / cityData.length).toFixed(2);

            const conditionFrequency = cityData.reduce((acc, item) => {
                acc[item.main] = (acc[item.main] || 0) + 1;
                return acc;
            }, {});
            const dominantCondition = Object.keys(conditionFrequency).reduce((a, b) => conditionFrequency[a] > conditionFrequency[b] ? a : b);

            return {
                city,
                avgTemp,
                maxTemp,
                minTemp,
                avgHumidity,
                avgWindSpeed,
                dominantCondition,
            };
        });

        setDailySummaries(dailyData);
    };

    const updateHistoricalTrends = (data) => {
        const historicalData = cityOrder.map(city => {
            const cityData = data.filter(item => item.city === city);
            if (!cityData.length) return { city, trends: 'No data available' };

            const trends = cityData.slice(-7).map(item => ({
                date: new Date(item.dt * 1000).toLocaleDateString(),
                temp: item.temp,
            }));
            return { city, trends };
        });

        setHistoricalTrends(historicalData);
    };

    const checkAlerts = (data) => {
        const breaches = data.filter(item => item.temp > threshold);
        setAlert(breaches.length > 0 ? `Alert: ${breaches.length} cities have exceeded the threshold of ${threshold}°C!` : '');
    };

    const handleThresholdChange = (event) => {
        setThreshold(Number(event.target.value));
    };

    const handleUnitChange = (event) => {
        const newUnit = event.target.value;
        setUnit(newUnit);
        localStorage.setItem('temperatureUnit', newUnit);
    };

    useEffect(() => {
        const fetchInterval = setInterval(fetchWeatherData, 300000); // Fetch every 5 minutes
        fetchWeatherData(); // Fetch data on component mount
        fetchWeatherForecasts(); // Fetch forecasts on component mount

        simulateWeatherUpdates(); // Simulate weather updates only once, on mount

        return () => clearInterval(fetchInterval); // Cleanup on unmount
    }, []); // Empty dependency array, so it runs only once on mount

    const convertTemperature = (temp, unit) => {
        if (typeof temp !== 'number' || isNaN(temp)) {
            return temp; // Return the string if it's "No data available"
        }
        return unit === 'K' ? (temp + 273.15).toFixed(2) : temp.toFixed(2); // Celsius to Kelvin if needed
    };

    const sendWeatherData = async (data) => {
        try {
            const response = await fetch('http://localhost:3001/api/weather', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to send weather data.');
            }
        } catch (error) {
            console.error('Error sending weather data:', error);
        }
    };

    return (
        <div style={styles.weatherContainer}>
            <h2>Weather Monitor</h2>

            <label>
                Select Temperature Unit:
                <select value={unit} onChange={handleUnitChange}>
                    <option value="C">Celsius</option>
                    <option value="K">Kelvin</option>
                </select>
            </label>

            <label>
                Set Temperature Threshold (°C):
                <input type="number" value={threshold} onChange={handleThresholdChange} />
            </label>

            {alert && <div style={{ color: 'red' }}>{alert}</div>}

            <h3>Latest Weather Updates</h3>
            <ul>
                {latestUpdates.map((item) => (
                    <li key={item.dt}>
                        {item.city}: {convertTemperature(item.temp, unit)}°{unit}, {item.main} - {item.timestamp}
                    </li>
                ))}
            </ul>

            <h3>Daily Weather Summaries</h3>
            <ul>
                {dailySummaries.map((summary) => (
                    <li key={summary.city}>
                        {summary.city}: Avg Temp: {convertTemperature(summary.avgTemp, unit)}°{unit}, Max Temp: {convertTemperature(summary.maxTemp, unit)}°{unit}, Min Temp: {convertTemperature(summary.minTemp, unit)}°{unit}, Avg Humidity: {summary.avgHumidity}%, Avg Wind Speed: {summary.avgWindSpeed} km/h, Condition: {summary.dominantCondition}
                    </li>
                ))}
            </ul>

            <h3>7-Day Historical Trends</h3>
            <ul>
                {historicalTrends.map((trend) => (
                    <li key={trend.city}>
                        {trend.city}: {trend.trends === 'No data available' ? trend.trends : trend.trends.map((t) => `${t.date}: ${convertTemperature(t.temp, unit)}°${unit}`).join(', ')}
                    </li>
                ))}
            </ul>

            <h3>Weather Forecasts</h3>
            <ul>
                {forecasts.map((forecast) => (
                    <li key={forecast.city}>
                        {forecast.city}: {convertTemperature(forecast.temp, unit)}°{unit}, {forecast.condition} - {forecast.timestamp}
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Styles
const styles = {
    weatherContainer: {
        backgroundColor: '#f4f4f9',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
        maxWidth: '800px',
        margin: 'auto',
    }
};

export default WeatherMonitor;
