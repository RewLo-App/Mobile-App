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
      <Circle cx="50" cy="50" r="49" fill="#1C2C5B" />
      <Circle cx="50" cy="50" r="46" fill="none" stroke="#C8A020" strokeWidth="5" />
      <Circle cx="50" cy="50" r="40" fill="none" stroke="#6CADDF" strokeWidth="1.5" />
      <SvgText x="30" y="21" fontSize="9" fill="#C8A020" textAnchor="middle">★</SvgText>
      <SvgText x="50" y="19" fontSize="9" fill="#C8A020" textAnchor="middle">★</SvgText>
      <SvgText x="70" y="21" fontSize="9" fill="#C8A020" textAnchor="middle">★</SvgText>
      <Path d="M48 37 C43 32 35 29 22 33 C28 31 38 34 46 40 Z" fill="#C8A020" />
      <Path d="M52 37 C57 32 65 29 78 33 C72 31 62 34 54 40 Z" fill="#C8A020" />
      <Ellipse cx="50" cy="40" rx="4.5" ry="5.5" fill="#C8A020" />
      <Ellipse cx="50" cy="33" rx="3.5" ry="4" fill="#C8A020" />
      <Polygon points="50,36 54,37 50,38.5" fill="#1C2C5B" />
      <Circle cx="51.5" cy="32.5" r="1" fill="#1C2C5B" />
      <Path d="M47 45 L44 52 M50 46 L50 53 M53 45 L56 52" stroke="#C8A020" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M30 54 L70 54 L70 73 Q70 85 50 90 Q30 85 30 73 Z" fill="#6CADDF" />
      <Path d="M30 63 L70 63 L70 68 L30 68 Z" fill="white" opacity="0.85" />
      <Path d="M42 79 Q50 83 58 79 L56 75 Q50 78 44 75 Z" fill="#1C2C5B" opacity="0.7" />
      <Rect x="49" y="56" width="2" height="18" fill="#1C2C5B" opacity="0.6" rx="1" />
      <Path d="M51 57 L51 68 L59 63 Z" fill="#1C2C5B" opacity="0.4" />
      <SvgText x="50" y="97" fontSize="7.5" fontWeight="bold" fill="#C8A020" textAnchor="middle" letterSpacing="2">
        MCFC
      </SvgText>
    </Svg>
  );
}

function CardinalsBadge({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Navy background */}
      <Circle cx="50" cy="50" r="49" fill="#0C2340" />
      {/* Red outer ring */}
      <Circle cx="50" cy="50" r="46" fill="none" stroke="#C41E3A" strokeWidth="5" />
      {/* Gold inner ring */}
      <Circle cx="50" cy="50" r="40" fill="none" stroke="#FEDB00" strokeWidth="1.5" />

      {/* ── Baseball bat (diagonal, gold) ── */}
      {/* Bat handle (thin, lower-left) */}
      <Path
        d="M28 75 Q30 73 58 32 Q60 29 63 27 Q67 25 68 28 Q69 31 66 34 Q63 37 35 78 Q32 80 29 79 Z"
        fill="#FEDB00"
      />
      {/* Bat knob */}
      <Ellipse cx="29" cy="77" rx="4" ry="3" fill="#FEDB00" transform="rotate(-40 29 77)" />

      {/* ── Cardinal bird body ── */}
      {/* Body */}
      <Ellipse cx="52" cy="46" rx="12" ry="10" fill="#C41E3A" transform="rotate(-15 52 46)" />
      {/* Tail */}
      <Path
        d="M44 52 Q38 60 34 58 Q38 56 42 55 Z"
        fill="#C41E3A"
      />
      {/* Wing highlight */}
      <Path
        d="M48 42 Q55 38 62 42 Q56 40 50 44 Z"
        fill="#9B1626"
        opacity="0.8"
      />

      {/* ── Cardinal head ── */}
      <Circle cx="60" cy="37" r="9" fill="#C41E3A" />
      {/* Crest (pointed top of head) */}
      <Path
        d="M60 28 Q58 22 62 20 Q65 23 63 28 Z"
        fill="#C41E3A"
      />
      {/* Eye */}
      <Circle cx="63" cy="35" r="2.5" fill="#0C2340" />
      <Circle cx="63.8" cy="34.2" r="0.8" fill="#FEDB00" />

      {/* Beak */}
      <Path
        d="M68 36 L75 33 L68 39 Z"
        fill="#FEDB00"
      />
      {/* Beak line */}
      <Path
        d="M68 37 L75 36"
        stroke="#C8A000"
        strokeWidth="0.8"
      />

      {/* Black mask around eye */}
      <Path
        d="M57 35 Q60 32 67 34 Q68 36 67 38 Q60 37 57 36 Z"
        fill="#0C2340"
        opacity="0.6"
      />

      {/* STL text */}
      <SvgText
        x="50"
        y="97"
        fontSize="8"
        fontWeight="bold"
        fill="#FEDB00"
        textAnchor="middle"
        letterSpacing="2"
      >
        STL
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
      <SvgText x="50" y="57" fontSize={fontSize} fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
        {club.abbreviation}
      </SvgText>
    </Svg>
  );
}

export default function ClubBadge({ club, size = 48 }: ClubBadgeProps) {
  if (club.id === "man-city") return <MCFCBadge size={size} />;
  if (club.id === "stl-cardinals") return <CardinalsBadge size={size} />;
  return <GenericBadge club={club} size={size} />;
}
