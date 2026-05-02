import React from 'react';

const Index = () => {
    const SPIN_MS = 3000;
    return (
        <div>
            {/* Other code... */}
            <div style={{
                transition: 'transform ${SPIN_MS}ms cubic-bezier(0.25, 0.46, 0.94)',
            }}>
                {/* Spin Animation */}
            </div>
        </div>
    );
};

export default Index;