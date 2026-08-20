import React, { useRef, useState, useEffect } from 'react';

export default function ScrollingText({ text, className }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        // We use the first child's width if it's overflowing to know the real text width
        const originalTextWidth = textRef.current.children[0]?.offsetWidth || textRef.current.scrollWidth;
        setIsOverflowing(originalTextWidth > containerRef.current.clientWidth);
      }
    };
    
    // Check after a small delay to ensure rendering is done
    const timer = setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap mask-edges ${className}`}>
      <div 
        ref={textRef}
        className={`inline-block ${isOverflowing ? 'animate-marquee' : ''}`}
      >
        <span className="inline-block">{text}</span>
        {isOverflowing && <span className="inline-block pl-12">{text}</span>}
      </div>
    </div>
  );
}
