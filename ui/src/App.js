import React from 'react';
import WeatherMonitor from './components/WeatherMonitor';

const App = () => {
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Real-Time Weather Monitoring System</h1>
            </header>
            <main style={styles.main}>
                <WeatherMonitor />
            </main>
        </div>
    );
};

const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f4f7f9',
        minHeight: '100vh',
        padding: '20px',
    },
    header: {
        backgroundColor: '#4a90e2',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center',
        color: 'white',
    },
    title: {
        margin: 0,
        fontSize: '2.5rem',
    },
    main: {
        marginTop: '30px',
        display: 'flex',
        justifyContent: 'center',
    },
};

export default App;
