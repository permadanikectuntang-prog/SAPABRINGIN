import React from 'react';

interface BringinEmblemProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logoUrl?: string;
}

export const BringinEmblem: React.FC<BringinEmblemProps> = ({ 
  className = '', 
  size = 'md',
  logoUrl 
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-[7px]',
    md: 'w-10 h-10 text-[8px]',
    lg: 'w-16 h-16 text-[10px]',
    xl: 'w-24 h-24 text-[12px]',
  };

  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt="Logo Kecamatan Bringin" 
        className={`${sizeMap[size].split(' ')[0]} ${sizeMap[size].split(' ')[1]} object-contain rounded-md shadow-xs ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Official municipal crest SVG styling (Pemerintah Kabupaten Semarang / Kecamatan Bringin)
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeMap[size].split(' ')[0]} ${sizeMap[size].split(' ')[1]} ${className}`}
      title="Lambang Kecamatan Bringin, Kabupaten Semarang"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
        {/* Outer Gold Ring */}
        <circle cx="50" cy="50" r="48" fill="#064E3B" stroke="#D97706" strokeWidth="3" />
        
        {/* Inner Shield */}
        <path
          d="M 50 14 C 68 14 78 24 78 48 C 78 70 50 86 50 86 C 50 86 22 70 22 48 C 22 24 32 14 50 14 Z"
          fill="#047857"
          stroke="#FBBF24"
          strokeWidth="2"
        />

        {/* Central Star - Ketuhanan */}
        <polygon 
          points="50,22 53,30 61,30 55,35 57,43 50,38 43,43 45,35 39,30 47,30" 
          fill="#FDE047" 
          stroke="#B45309"
          strokeWidth="0.8"
        />

        {/* Banyan Tree / Pohon Beringin - Symbol of Bringin */}
        <path
          d="M 43 58 Q 50 54 57 58 L 54 68 L 46 68 Z"
          fill="#78350F"
        />
        <path
          d="M 50 44 C 40 44 36 50 38 56 C 41 62 48 60 50 60 C 52 60 59 62 62 56 C 64 50 60 44 50 44 Z"
          fill="#10B981"
          stroke="#064E3B"
          strokeWidth="1"
        />

        {/* Golden Rice & Cotton stalks on sides */}
        <path 
          d="M 28 62 C 24 50 26 36 34 28" 
          fill="none" 
          stroke="#F59E0B" 
          strokeWidth="2.5" 
          strokeDasharray="2,2" 
        />
        <path 
          d="M 72 62 C 76 50 74 36 66 28" 
          fill="none" 
          stroke="#F59E0B" 
          strokeWidth="2.5" 
          strokeDasharray="2,2" 
        />

        {/* Ribbon banner at bottom */}
        <path
          d="M 30 76 Q 50 72 70 76 L 68 83 Q 50 79 32 83 Z"
          fill="#D97706"
          stroke="#78350F"
          strokeWidth="0.8"
        />
        <text 
          x="50" 
          y="80" 
          textAnchor="middle" 
          fill="#FFFFFF" 
          fontSize="4.5" 
          fontWeight="bold" 
          fontFamily="system-ui"
          letterSpacing="0.5"
        >
          BRINGIN
        </text>
      </svg>
    </div>
  );
};
