import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import EnhancedCalendar from '../Calendar/EnhancedCalendar';
import './Print.css';

const PrintComponent = () => {
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div>
      <button onClick={handlePrint} className="glass-button">
        인쇄
      </button>
      <div style={{ display: 'none' }}>
        <div ref={componentRef} className="print-container">
          <EnhancedCalendar />
        </div>
      </div>
    </div>
  );
};

export default PrintComponent;
