import React from 'react';

const BuggyComponent = () => {
    // This will throw an error when rendered
    const throwError = () => {
        throw new Error("I crashed on purpose! 💥");
    };

    return (
        <div style={{ padding: '20px' }}>
            <h3>Crash Test Component</h3>
            <p>Click the button below to trigger an error and test the ErrorBoundary.</p>
            <button
                onClick={throwError}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginTop: '12px'
                }}
            >
                Trigger Error
            </button>
        </div>
    );
};

export default BuggyComponent;
