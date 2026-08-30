import React from "react";

interface SettaLionLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const SettaLionLogo: React.FC<SettaLionLogoProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    xs: "w-5 h-5",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="settaGreenGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="30%" stopColor="#22c55e" />
            <stop offset="80%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#052e16" />
          </linearGradient>
          <linearGradient id="settaGreenGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14532d" />
            <stop offset="50%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="settaGreenGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="40%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <linearGradient id="settaLimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>

        {/* Setta SL Limited Majestic Emerald Lion Profile formed by curved organic leaf-mane petals */}
        {/* Mane Leaf Top Feather 1 */}
        <path
          d="M 95 55 C 105 38 120 48 124 72 C 115 62 105 60 95 55 Z"
          fill="url(#settaLimeGrad)"
        />

        {/* Mane Leaf Top Feather 2 */}
        <path
          d="M 94 54 C 80 58 70 70 68 88 C 76 74 86 66 94 54 Z"
          fill="url(#settaGreenGrad1)"
        />

        {/* Mane Leaf Upper Middle 3 */}
        <path
          d="M 68 87 C 62 105 65 125 72 138 C 72 120 74 102 85 90 C 78 88 72 88 68 87 Z"
          fill="url(#settaGreenGrad2)"
        />

        {/* Mane Leaf Upper Swoop 4 */}
        <path
          d="M 85 90 C 72 106 74 130 90 156 C 88 136 92 118 104 108 C 96 102 90 96 85 90 Z"
          fill="url(#settaGreenGrad3)"
        />

        {/* Mane Leaf Lower Swoop 5 */}
        <path
          d="M 90 156 C 84 140 85 120 98 108 C 90 126 95 150 122 172 C 104 168 94 162 90 156 Z"
          fill="url(#settaGreenGrad1)"
        />

        {/* Mane Chin Leaf 6 */}
        <path
          d="M 122 172 C 108 162 104 144 105 130 C 115 142 120 155 122 172 Z"
          fill="url(#settaLimeGrad)"
        />

        {/* Central Lion Face Silhouette (Crisp, Proud Profile) */}
        <path
          d="M 95 55 C 108 72 105 92 120 98 C 126 101 130 106 130 110 C 128 114 122 115 120 118 C 126 122 128 128 124 132 C 118 132 110 128 105 130 C 108 115 95 102 94 54 Z"
          fill="#ffffff"
        />

        {/* Lion Eye (Dark Emerald / Sharp Regal Slit) */}
        <polygon
          points="110,90 120,95 116,99 108,94"
          fill="#052e16"
        />

        {/* Lion Nose / Snout Shadow */}
        <polygon
          points="126,108 130,111 125,116 122,112"
          fill="#052e16"
        />

        {/* Lion Mouth Line / Roar Contour */}
        <path
          d="M 120 118 C 124 124 116 126 112 128"
          stroke="#052e16"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
