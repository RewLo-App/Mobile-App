import React from "react";
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";

import { Club } from "@/constants/clubs";

interface ClubBadgeProps {
  club: Club;
  size?: number;
}

function MCFCBadge({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Navy fill */}
      <Circle cx="50" cy="50" r="49" fill="#1C2C5B" />

      {/* Gold outer ring */}
      <Circle cx="50" cy="50" r="46" fill="none" stroke="#C8A020" strokeWidth="5" />

      {/* Sky-blue inner ring */}
      <Circle cx="50" cy="50" r="40" fill="none" stroke="#6CADDF" strokeWidth="1.5" />

      {/* Three gold stars */}
      <SvgText x="30" y="21" fontSize="9" fill="#C8A020" textAnchor="middle">★</SvgText>
      <SvgText x="50" y="19" fontSize="9" fill="#C8A020" textAnchor="middle">★</SvgText>
      <SvgText x="70" y="21" fontSize="9" fill="#C8A020" textAnchor="middle">★</SvgText>

      {/* ── Eagle ── */}
      {/* Left wing */}
      <Path
        d="M48 37
           C43 32 35 29 22 33
           C28 31 38 34 46 40 Z"
        fill="#C8A020"
      />
      {/* Right wing */}
      <Path
        d="M52 37
           C57 32 65 29 78 33
           C72 31 62 34 54 40 Z"
        fill="#C8A020"
      />
      {/* Eagle body */}
      <Ellipse cx="50" cy="40" rx="4.5" ry="5.5" fill="#C8A020" />
      {/* Eagle neck + head */}
      <Ellipse cx="50" cy="33" rx="3.5" ry="4" fill="#C8A020" />
      {/* Beak */}
      <Polygon points="50,36 54,37 50,38.5" fill="#1C2C5B" />
      {/* Eagle eye */}
      <Circle cx="51.5" cy="32.5" r="1" fill="#1C2C5B" />
      {/* Tail feathers */}
      <Path
        d="M47 45 L44 52 M50 46 L50 53 M53 45 L56 52"
        stroke="#C8A020"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* ── Shield / lower crest ── */}
      <Path
        d="M30 54 L70 54 L70 73 Q70 85 50 90 Q30 85 30 73 Z"
        fill="#6CADDF"
      />
      {/* Two horizontal white bands giving a "stripes" look */}
      <Path d="M30 63 L70 63 L70 68 L30 68 Z" fill="white" opacity="0.85" />

      {/* Ship hull (Manchester's coat of arms element) */}
      <Path
        d="M42 79 Q50 83 58 79 L56 75 Q50 78 44 75 Z"
        fill="#1C2C5B"
        opacity="0.7"
      />
      {/* Mast */}
      <Rect x="49" y="56" width="2" height="18" fill="#1C2C5B" opacity="0.6" rx="1" />
      {/* Sail */}
      <Path d="M51 57 L51 68 L59 63 Z" fill="#1C2C5B" opacity="0.4" />

      {/* Bottom text */}
      <SvgText
        x="50"
        y="97"
        fontSize="7.5"
        fontWeight="bold"
        fill="#C8A020"
        textAnchor="middle"
        letterSpacing="2"
      >
        MCFC
      </SvgText>
    </Svg>
  );
}

function GenericBadge({ club, size }: { club: Club; size: number }) {
  const fontSize = size * 0.28;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="49" fill={club.gradientStart} />
      <Circle cx="50" cy="50" r="44" fill="none" stroke={club.gradientEnd} strokeWidth="4" />
      <Circle cx="50" cy="50" r="39" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <SvgText
        x="50"
        y="57"
        fontSize={fontSize}
        fontWeight="bold"
        fill="#FFFFFF"
        textAnchor="middle"
      >
        {club.abbreviation}
      </SvgText>
    </Svg>
  );
}

export default function ClubBadge({ club, size = 48 }: ClubBadgeProps) {
  if (club.id === "man-city") {
    return <MCFCBadge size={size} />;
  }
  return <GenericBadge club={club} size={size} />;
}
