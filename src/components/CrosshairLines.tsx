interface CrosshairLinesProps {
  position?: 'top-left' | 'bottom-right' | 'center';
  className?: string;
}

export default function CrosshairLines({ position = 'center', className = '' }: CrosshairLinesProps) {
  const posStyles: Record<string, React.CSSProperties> = {
    'top-left': { left: '0%', top: '0%', transform: 'translate(-50%, -50%)' },
    'bottom-right': { left: '100%', top: '100%', transform: 'translate(-50%, -50%)' },
    'center': { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
  };

  return (
    <svg
      className={`absolute pointer-events-none transition-all duration-500 ${className}`}
      style={{ ...posStyles[position], width: '600px', height: '500px' }}
    >
      <line
        x1="0" y1="50%" x2="100%" y2="50%"
        className="stroke-[rgba(255,255,255,0.06)] group-hover:stroke-[rgba(153,69,255,0.15)] transition-all duration-500"
        strokeWidth="1"
        strokeDasharray="7 7"
      />
      <line
        x1="50%" y1="0" x2="50%" y2="100%"
        className="stroke-[rgba(255,255,255,0.06)] group-hover:stroke-[rgba(153,69,255,0.15)] transition-all duration-500"
        strokeWidth="1"
        strokeDasharray="7 7"
      />
    </svg>
  );
}
