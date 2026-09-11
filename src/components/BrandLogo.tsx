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
  theme = "yellow",
  subtitle,
}) => {
  // Size metrics
  const sizeMap = {
    xs: { box: 22, height: 26, width: 80, fontSize: "text-base", iconSize: "w-7 h-7", appIconPx: 28 },
    sm: { box: 28, height: 32, width: 100, fontSize: "text-lg", iconSize: "w-9 h-9", appIconPx: 36 },
    md: { box: 34, height: 42, width: 130, fontSize: "text-2xl", iconSize: "w-12 h-12", appIconPx: 48 },
    lg: { box: 44, height: 54, width: 165, fontSize: "text-3xl", iconSize: "w-16 h-16", appIconPx: 64 },
    xl: { box: 60, height: 72, width: 220, fontSize: "text-4xl sm:text-5xl", iconSize: "w-20 h-20", appIconPx: 84 },
    hero: { box: 80, height: 96, width: 280, fontSize: "text-5xl sm:text-6xl", iconSize: "w-28 h-28", appIconPx: 112 },
  };

  const current = sizeMap[size];

  // Official INCO 3D Isometric Cube Box SVG (Yellow top, dark sides, yellow checkmark)
  const IncoBoxCube: React.FC<{ sizePx?: number; animated?: boolean }> = ({
    sizePx = current.box,
    animated: isAnim = animated,
  }) => (
    <motion.svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
      animate={
        isAnim
          ? {
              y: [0, -3, 0],
            }
          : undefined
      }
      transition={
        isAnim
          ? {
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
    >
      <defs>
        <linearGradient id="incoBoxYellowTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF200" />
          <stop offset="60%" stopColor="#FFE600" />
          <stop offset="100%" stopColor="#FACC15" />
        </linearGradient>
        <linearGradient id="incoBoxLeftDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#252A34" />
          <stop offset="100%" stopColor="#14171E" />
        </linearGradient>
        <linearGradient id="incoBoxRightDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#303744" />
          <stop offset="100%" stopColor="#1E232B" />
        </linearGradient>
      </defs>

      {/* Top Diamond Face (Yellow) */}
      <polygon
        points="50,12 84,31 50,50 16,31"
        fill="url(#incoBoxYellowTop)"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Left Face (Dark Charcoal) */}
      <polygon
        points="16,33 50,52 50,88 16,69"
        fill="url(#incoBoxLeftDark)"
        stroke="#333D4F"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Right Face (Dark Charcoal with Yellow Checkmark) */}
      <polygon
        points="50,52 84,33 84,69 50,88"
        fill="url(#incoBoxRightDark)"
        stroke="#333D4F"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Signature Yellow Checkmark */}
      <path
        d="M 59 60 L 68 70 L 78 51"
        fill="none"
        stroke="#FFE600"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );

  // Official INCO App Icon Style (Exact replica of the user's bright electric lime-yellow squircle app icon)
  if (theme === "yellowAppIcon") {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none ${className}`}
        style={{ width: current.appIconPx, height: current.appIconPx }}
      >
        <svg
          viewBox="0 0 512 512"
          width={current.appIconPx}
          height={current.appIconPx}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <filter id={`incoTileShadow-${size}`} x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.14" />
            </filter>
          </defs>

          {/* Electric Lime-Yellow Rounded App Icon Squircle */}
          <rect width="512" height="512" rx="116" fill="#E2F800" />

          {/* Centered App Mark */}
          <g transform="translate(-4, 18)">
            {/* 3D Isometric Cube */}
            <g filter={`url(#incoTileShadow-${size})`}>
              {/* Top Face */}
              <polygon
                points="108,124 144,144 108,164 72,144"
                fill="#E2F800"
                stroke="#1F2126"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              {/* Left Charcoal Face */}
              <polygon
                points="72,144 108,164 108,210 72,190"
                fill="#1F2126"
                stroke="#1F2126"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Right Charcoal Face */}
              <polygon
                points="108,164 144,144 144,190 108,210"
                fill="#1F2126"
                stroke="#1F2126"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Signature Electric Yellow Checkmark on Right Face */}
              <path
                d="M 115 186 L 125 196 L 138 170"
                fill="none"
                stroke="#E2F800"
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
              rx="12"
              fill="#1F2126"
            />

            {/* Letter 'n' */}
            <path
              d="M 152 340 L 152 238 M 152 266 C 152 236 172 224 196 224 C 220 224 240 238 240 268 L 240 340"
              fill="none"
              stroke="#1F2126"
              strokeWidth="30"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Letter 'c' */}
            <path
              d="M 344 254 C 331 236 313 224 288 224 C 253 224 233 252 233 282 C 233 314 253 340 288 340 C 313 340 331 328 344 310"
              fill="none"
              stroke="#1F2126"
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
              stroke="#1F2126"
              strokeWidth="30"
            />
          </g>
        </svg>
      </div>
    );
  }

  // Full Vector Authentic INCO Logo with 3D box on top of the "i"
  const letterFill =
    theme === "darkLetters"
      ? "#1E222B"
      : "#FFE600"; // Signature INCO bright vibrant yellow

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="inline-flex items-end select-none">
        <svg
          width={current.width}
          height={current.height}
          viewBox="0 0 220 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          {/* 3D Isometric Cube perched as the dot of the letter 'i' */}
          <g transform="translate(18, 0) scale(0.42)">
            {/* Top Face */}
            <polygon
              points="50,10 86,30 50,50 14,30"
              fill="#FFE600"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Left Face */}
            <polygon
              points="14,32 50,52 50,90 14,70"
              fill="#1E232B"
              stroke="#2E3746"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Right Face */}
            <polygon
              points="50,52 86,32 86,70 50,90"
              fill="#28303C"
              stroke="#2E3746"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Yellow Checkmark on Cube */}
            <path
              d="M 59 62 L 67 71 L 80 50"
              fill="none"
              stroke="#FFE600"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Letter 'i' stem */}
          <rect
            x="24"
            y="38"
            width="14"
            height="40"
            rx="7"
            fill={letterFill}
          />

          {/* Letter 'n' */}
          <path
            d="M 54 38 L 54 78 M 54 52 C 54 42 63 38 72 38 C 82 38 88 43 88 54 L 88 78"
            stroke={letterFill}
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Letter 'c' */}
          <path
            d="M 142 46 C 137 39 128 36 117 36 C 103 36 94 47 94 58 C 94 70 104 80 117 80 C 128 80 137 77 142 70"
            stroke={letterFill}
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Letter 'o' */}
          <ellipse
            cx="178"
            cy="58"
            rx="20"
            ry="20"
            stroke={letterFill}
            strokeWidth="14"
          />
        </svg>
      </div>

      {subtitle && (
        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 uppercase -mt-0.5 ml-1">
          {subtitle}
        </span>
      )}
    </div>
  );
};
