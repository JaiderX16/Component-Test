import React, { useState } from 'react';

const TestButton = () => {
    const [count, setCount] = useState(0);

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px', color: '#111' }}>Interactive Button Test</h3>
            <button
                style={{
                    padding: '12px 24px',
                    fontSize: '1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                onClick={() => setCount(count + 1)}
            >
                Clicked {count} times
            </button>
            <p style={{ marginTop: '10px', color: '#666', fontSize: '0.9rem' }}>
                This component tests state and basic styling.
            </p>
        </div>
    );
};

export default TestButton;
