import React from "react";
import { motion } from "motion/react";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  animated?: boolean;
  showText?: boolean;
  className?: string;
  theme?: "yellow" | "darkLetters" | "yellowAppIcon" | "compact";
  subtitle?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  animated = false,
  showText = true,
  className = "",
  theme = "yellowAppIcon",
  subtitle,
}) => {
  // Size metrics
  const sizeMap = {
    xs: { box: 22, height: 26, width: 80, fontSize: "text-base", iconSize: "w-7 h-7", appIconPx: 30 },
    sm: { box: 28, height: 32, width: 100, fontSize: "text-lg", iconSize: "w-9 h-9", appIconPx: 38 },
    md: { box: 34, height: 42, width: 130, fontSize: "text-2xl", iconSize: "w-12 h-12", appIconPx: 48 },
    lg: { box: 44, height: 54, width: 165, fontSize: "text-3xl", iconSize: "w-16 h-16", appIconPx: 64 },
    xl: { box: 60, height: 72, width: 220, fontSize: "text-4xl sm:text-5xl", iconSize: "w-20 h-20", appIconPx: 84 },
    hero: { box: 80, height: 96, width: 280, fontSize: "text-5xl sm:text-6xl", iconSize: "w-28 h-28", appIconPx: 120 },
  };

  const current = sizeMap[size];

  // Official INCO App Icon Style (Exact replica of the uploaded image: #E5F107 squircle with #252525 "inco" and 3D checked cube)
  if (theme === "yellowAppIcon") {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none rounded-[22%] overflow-hidden shadow-sm ${className}`}
        style={{ width: current.appIconPx, height: current.appIconPx }}
      >
        <svg
          viewBox="0 0 512 512"
          width={current.appIconPx}
          height={current.appIconPx}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            <filter id={`incoTileShadow-${size}`} x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.14" />
            </filter>
          </defs>

          {/* Official Lime-Yellow Squircle #E5F107 */}
          <rect width="512" height="512" rx="120" fill="#E5F107" />

          {/* Centered App Mark: #252525 letters and isometric box */}
          <g transform="translate(-4, 18)">
            {/* 3D Isometric Cube */}
            <g filter={`url(#incoTileShadow-${size})`}>
              {/* Top Face (#E5F107 with #252525 border) */}
              <polygon
                points="108,124 144,144 108,164 72,144"
                fill="#E5F107"
                stroke="#252525"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              {/* Left Face (#252525) */}
              <polygon
                points="72,144 108,164 108,210 72,190"
                fill="#252525"
                stroke="#252525"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Right Face (#252525 with Yellow checkmark) */}
              <polygon
                points="108,164 144,144 144,190 108,210"
                fill="#252525"
                stroke="#252525"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Signature Yellow Checkmark on Right Face (#E5F107) */}
              <path
                d="M 115 186 L 125 196 L 138 170"
                fill="none"
                stroke="#E5F107"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Letter 'i' Stem */}
            <rect
              x="93"
              y="226"
              width="30"
              height="114"
              rx="14"
              fill="#252525"
            />

            {/* Letter 'n' */}
            <path
              d="M 152 340 L 152 238 M 152 266 C 152 236 172 224 196 224 C 220 224 240 238 240 268 L 240 340"
              fill="none"
              stroke="#252525"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Letter 'c' */}
            <path
              d="M 344 254 C 331 236 313 224 288 224 C 253 224 233 252 233 282 C 233 314 253 340 288 340 C 313 340 331 328 344 310"
              fill="none"
              stroke="#252525"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Letter 'o' */}
            <circle
              cx="410"
              cy="282"
              r="44"
              fill="none"
              stroke="#252525"
              strokeWidth="30"
            />
          </g>
        </svg>
      </div>
    );
  }

  // Horizontal Wordmark Logo with the 3D cube topping the 'i'
  const letterFill = theme === "darkLetters" ? "#252525" : "#252525";

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Visual icon mark */}
      <div
        className="relative inline-flex items-center justify-center shrink-0 rounded-[22%] overflow-hidden shadow-xs"
        style={{ width: current.appIconPx, height: current.appIconPx }}
      >
        <svg
          viewBox="0 0 512 512"
          width={current.appIconPx}
          height={current.appIconPx}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="512" height="512" rx="120" fill="#E5F107" />
          <g transform="translate(-4, 18)">
            <polygon
              points="108,124 144,144 108,164 72,144"
              fill="#E5F107"
              stroke="#252525"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <polygon
              points="72,144 108,164 108,210 72,190"
              fill="#252525"
              stroke="#252525"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <polygon
              points="108,164 144,144 144,190 108,210"
              fill="#252525"
              stroke="#252525"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M 115 186 L 125 196 L 138 170"
              fill="none"
              stroke="#E5F107"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="93" y="226" width="30" height="114" rx="14" fill="#252525" />
            <path
              d="M 152 340 L 152 238 M 152 266 C 152 236 172 224 196 224 C 220 224 240 238 240 268 L 240 340"
              fill="none"
              stroke="#252525"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 344 254 C 331 236 313 224 288 224 C 253 224 233 252 233 282 C 233 314 253 340 288 340 C 313 340 331 328 344 310"
              fill="none"
              stroke="#252525"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="410" cy="282" r="44" fill="none" stroke="#252525" strokeWidth="30" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1">
            <span className="font-black tracking-tight text-slate-900 text-lg sm:text-xl font-sans">
              inco
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#E5F107] text-[#252525] border border-black/10">
              POS
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] sm:text-xs font-semibold tracking-tight text-slate-500 -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
