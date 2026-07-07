import React, { useState } from "react";
import { Image, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

import { Club, CLUB_LOGO_URLS } from "@/constants/clubs";

interface ClubBadgeProps {
  club: Club;
  size?: number;
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
  const [imgError, setImgError] = useState(false);
  const logoUrl = CLUB_LOGO_URLS[club.id];

  if (logoUrl && !imgError) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: club.badgeBackground,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: logoUrl }}
          style={{ width: size * 0.82, height: size * 0.82 }}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      </View>
    );
  }

  return <GenericBadge club={club} size={size} />;
}
