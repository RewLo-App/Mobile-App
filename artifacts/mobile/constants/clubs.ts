export interface Club {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  league: string;
  gradientStart: string;
  gradientEnd: string;
  accentColor: string;
  badgeBackground: string;
}

export const CLUBS: Club[] = [
  {
    id: "man-city",
    name: "Manchester City",
    shortName: "Man City",
    abbreviation: "MCFC",
    league: "Premier League",
    gradientStart: "#6CADDF",
    gradientEnd: "#1C2C5B",
    accentColor: "#6CADDF",
    badgeBackground: "#1C2C5B",
  },
  {
    id: "arsenal",
    name: "Arsenal",
    shortName: "Arsenal",
    abbreviation: "AFC",
    league: "Premier League",
    gradientStart: "#9C0000",
    gradientEnd: "#EF0107",
    accentColor: "#EF0107",
    badgeBackground: "#EF0107",
  },
  {
    id: "chelsea",
    name: "Chelsea",
    shortName: "Chelsea",
    abbreviation: "CFC",
    league: "Premier League",
    gradientStart: "#034694",
    gradientEnd: "#003CBF",
    accentColor: "#034694",
    badgeBackground: "#034694",
  },
  {
    id: "liverpool",
    name: "Liverpool",
    shortName: "Liverpool",
    abbreviation: "LFC",
    league: "Premier League",
    gradientStart: "#C8102E",
    gradientEnd: "#8B0000",
    accentColor: "#C8102E",
    badgeBackground: "#C8102E",
  },
  {
    id: "man-utd",
    name: "Manchester United",
    shortName: "Man United",
    abbreviation: "MUFC",
    league: "Premier League",
    gradientStart: "#DA291C",
    gradientEnd: "#8C0000",
    accentColor: "#DA291C",
    badgeBackground: "#DA291C",
  },
  {
    id: "tottenham",
    name: "Tottenham Hotspur",
    shortName: "Spurs",
    abbreviation: "THFC",
    league: "Premier League",
    gradientStart: "#132257",
    gradientEnd: "#0A1540",
    accentColor: "#FFFFFF",
    badgeBackground: "#132257",
  },
  {
    id: "barcelona",
    name: "FC Barcelona",
    shortName: "Barcelona",
    abbreviation: "FCB",
    league: "La Liga",
    gradientStart: "#004D98",
    gradientEnd: "#A50044",
    accentColor: "#EDBB00",
    badgeBackground: "#004D98",
  },
  {
    id: "real-madrid",
    name: "Real Madrid",
    shortName: "Real Madrid",
    abbreviation: "RMA",
    league: "La Liga",
    gradientStart: "#00529F",
    gradientEnd: "#003070",
    accentColor: "#FEBE10",
    badgeBackground: "#00529F",
  },
  {
    id: "psg",
    name: "Paris Saint-Germain",
    shortName: "PSG",
    abbreviation: "PSG",
    league: "Ligue 1",
    gradientStart: "#003370",
    gradientEnd: "#001B40",
    accentColor: "#EE1F39",
    badgeBackground: "#003370",
  },
  {
    id: "juventus",
    name: "Juventus",
    shortName: "Juventus",
    abbreviation: "JFC",
    league: "Serie A",
    gradientStart: "#1A1A1A",
    gradientEnd: "#000000",
    accentColor: "#FFFFFF",
    badgeBackground: "#1A1A1A",
  },
  {
    id: "dortmund",
    name: "Borussia Dortmund",
    shortName: "Dortmund",
    abbreviation: "BVB",
    league: "Bundesliga",
    gradientStart: "#FDE100",
    gradientEnd: "#D4B800",
    accentColor: "#000000",
    badgeBackground: "#FDE100",
  },
  {
    id: "bayern",
    name: "Bayern Munich",
    shortName: "Bayern",
    abbreviation: "FCB",
    league: "Bundesliga",
    gradientStart: "#DC052D",
    gradientEnd: "#8B001B",
    accentColor: "#DC052D",
    badgeBackground: "#DC052D",
  },
];

export const DEFAULT_CLUB_ID = "man-city";

export function getClubById(id: string): Club {
  return CLUBS.find((c) => c.id === id) ?? CLUBS[0];
}
