
import React, { useEffect, useState } from 'react';

interface RadialGaugeProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  label?: string;
}

const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  max,
  size = 100,
  strokeWidth = 8,
  colorFrom = '#00D0E8',
  colorTo = '#A6FF4D',
  label,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setDisplayValue(value));
    return () => cancelAnimationFrame(animation);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = displayValue / max;
  const offset = circumference * (1 - progress);

  const gradientId = `gradient-${Math.random().toString(36).substring(7)}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-orbitron font-bold text-xl" style={{ color: colorTo }}>
            {Math.round(displayValue)}
            {label?.includes('%') ? '%' : ''}
        </span>
        {label && !label.includes('%') && <span className="text-xs uppercase opacity-70">{label}</span>}
      </div>
    </div>
  );
};

export default RadialGauge;
