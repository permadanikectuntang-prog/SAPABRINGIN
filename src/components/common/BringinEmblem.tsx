import React, { useState } from 'react';

export const OFFICIAL_KAB_SEMARANG_LOGO = '/assets/aistudio/Lambang_Kabupaten_Semarang_157237ff.webp';

interface BringinEmblemProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  logoUrl?: string;
  alt?: string;
}

export const BringinEmblem: React.FC<BringinEmblemProps> = ({ 
  className = '', 
  size = 'md',
  logoUrl,
  alt = 'Lambang Kabupaten Semarang'
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: 'w-8 h-8 text-[7px]',
    md: 'w-10 h-10 text-[8px]',
    lg: 'w-16 h-16 text-[10px]',
    xl: 'w-24 h-24 text-[12px]',
    '2xl': 'w-32 h-32 text-[14px]',
  };

  // Default to official Kabupaten Semarang crest
  const currentUrl = (logoUrl && logoUrl.trim() !== '') ? logoUrl : OFFICIAL_KAB_SEMARANG_LOGO;

  if (!imgError && currentUrl) {
    return (
      <img 
        src={currentUrl} 
        alt={alt} 
        onError={() => setImgError(true)}
        className={`${sizeMap[size].split(' ')[0]} ${sizeMap[size].split(' ')[1]} object-contain drop-shadow-xs shrink-0 select-none ${className}`}
        loading="eager"
      />
    );
  }

  // Backup crest SVG in case offline or image load error
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeMap[size].split(' ')[0]} ${sizeMap[size].split(' ')[1]} ${className}`}
      title="Lambang Kabupaten Semarang - Kecamatan Bringin"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="48" fill="#064E3B" stroke="#D97706" strokeWidth="3" />
        {/* Shield */}
        <path
          d="M 50 14 C 68 14 78 24 78 48 C 78 70 50 86 50 86 C 50 86 22 70 22 48 C 22 24 32 14 50 14 Z"
          fill="#047857"
          stroke="#FBBF24"
          strokeWidth="2"
        />
        {/* Central Star */}
        <polygon 
          points="50,22 53,30 61,30 55,35 57,43 50,38 43,43 45,35 39,30 47,30" 
          fill="#FDE047" 
          stroke="#B45309"
          strokeWidth="0.8"
        />
        {/* Beringin */}
        <path d="M 43 58 Q 50 54 57 58 L 54 68 L 46 68 Z" fill="#78350F" />
        <path
          d="M 50 44 C 40 44 36 50 38 56 C 41 62 48 60 50 60 C 52 60 59 62 62 56 C 64 50 60 44 50 44 Z"
          fill="#10B981"
          stroke="#064E3B"
          strokeWidth="1"
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
          KAB. SEMARANG
        </text>
      </svg>
    </div>
  );
};
