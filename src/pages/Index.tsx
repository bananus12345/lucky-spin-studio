import React from "react";

const Index = () => {
  const SPIN_MS = 500; // jeśli masz to w innym miejscu, usuń tę linię

  return (
    <div
      style={{
        transition: `${SPIN_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      }}
    >
      {/* Tutaj wstawisz swoją zawartość */}
      <h1>Lucky Spin Studio</h1>
    </div>
  );
};

export default Index;
