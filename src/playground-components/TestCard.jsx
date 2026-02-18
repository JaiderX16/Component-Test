import React from 'react';

const TestCard = () => {
    return (
        <div style={{
            maxWidth: '300px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid #eee',
            fontFamily: 'sans-serif'
        }}>
            <div style={{ height: '150px', backgroundColor: '#6366f1' }}></div>
            <div style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Premium Card</h4>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    This is a test card to verify how complex layouts render in the playground.
                </p>
                <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e5e7eb' }}></div>
                    <div style={{ flex: 1 }}>
                        <div style={{ height: '12px', width: '60%', backgroundColor: '#f3f4f6', marginBottom: '4px' }}></div>
                        <div style={{ height: '8px', width: '40%', backgroundColor: '#f9fafb' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestCard;
