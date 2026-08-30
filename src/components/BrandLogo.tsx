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
    xs: { box: 22, height: 26, width: 80, fontSize: "text-base", iconSize: "w-6 h-6" },
    sm: { box: 28, height: 32, width: 100, fontSize: "text-lg", iconSize: "w-8 h-8" },
    md: { box: 34, height: 42, width: 130, fontSize: "text-2xl", iconSize: "w-10 h-10" },
    lg: { box: 44, height: 54, width: 165, fontSize: "text-3xl", iconSize: "w-14 h-14" },
    xl: { box: 60, height: 72, width: 220, fontSize: "text-4xl sm:text-5xl", iconSize: "w-20 h-20" },
    hero: { box: 80, height: 96, width: 280, fontSize: "text-5xl sm:text-6xl", iconSize: "w-24 h-24" },
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

  // App Icon Style (Bright Lime-Yellow Rounded Tile from Inco-App.png)
  if (theme === "yellowAppIcon") {
    const isSmall = size === "xs" || size === "sm";
    return (
      <div
        className={`relative ${current.iconSize} rounded-xl sm:rounded-2xl bg-amber-400 p-1.5 sm:p-2 flex flex-col items-center justify-center shadow-md border border-amber-300 font-sans cursor-pointer select-none shrink-0 ${className}`}
        style={{
          boxShadow: "0 4px 12px rgba(251, 191, 36, 0.35)",
        }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center relative">
          <div className={`${isSmall ? "w-4 h-4" : "w-1/2 h-1/2"} -mb-0.5 z-10 flex items-center justify-center`}>
            <IncoBoxCube sizePx={isSmall ? 16 : current.box * 0.7} animated={animated} />
          </div>
          <span className="font-black text-slate-950 tracking-tighter text-[9px] sm:text-xs font-sans lowercase leading-none">
            inco
          </span>
        </div>
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
