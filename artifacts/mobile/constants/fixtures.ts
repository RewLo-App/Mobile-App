export interface Fixture {
  id: string;
  clubId: string;
  opponent: string;
  opponentAbbr: string;
  isHome: boolean;
  venue: string;
  city: string;
  dateTime: string;
  competition: string;
  matchweek: string;
  stadiumOptions: StadiumOption[];
}

export interface StadiumOption {
  label: string;
  icon: string;
  amount: number;
}

const now = Date.now();
const h = 3600000;

export const FIXTURES: Fixture[] = [
  {
    id: "fix_mcfc",
    clubId: "man-city",
    opponent: "Real Madrid",
    opponentAbbr: "RMA",
    isHome: true,
    venue: "Etihad Stadium",
    city: "Manchester",
    dateTime: new Date(now + 4 * h).toISOString(),
    competition: "UEFA Champions League",
    matchweek: "Final",
    stadiumOptions: [
      { label: "Food & Drinks", icon: "fast-food-outline", amount: 18.5 },
      { label: "Club Merch", icon: "bag-outline", amount: 35.0 },
      { label: "Programme", icon: "book-outline", amount: 5.0 },
      { label: "Parking", icon: "car-outline", amount: 15.0 },
    ],
  },
  {
    id: "fix_afc",
    clubId: "arsenal",
    opponent: "Bayern Munich",
    opponentAbbr: "FCB",
    isHome: false,
    venue: "Allianz Arena",
    city: "Munich",
    dateTime: new Date(now + 28 * h).toISOString(),
    competition: "UEFA Champions League",
    matchweek: "Semi-Final",
    stadiumOptions: [
      { label: "Bratwurst", icon: "fast-food-outline", amount: 12.0 },
      { label: "Away Merch", icon: "bag-outline", amount: 28.0 },
      { label: "Programme", icon: "book-outline", amount: 5.0 },
      { label: "Stadium Tour", icon: "camera-outline", amount: 20.0 },
    ],
  },
  {
    id: "fix_cfc",
    clubId: "chelsea",
    opponent: "Manchester United",
    opponentAbbr: "MUFC",
    isHome: true,
    venue: "Stamford Bridge",
    city: "London",
    dateTime: new Date(now + 50 * h).toISOString(),
    competition: "Premier League",
    matchweek: "GW 38",
    stadiumOptions: [
      { label: "Food & Drinks", icon: "fast-food-outline", amount: 16.0 },
      { label: "Club Merch", icon: "bag-outline", amount: 40.0 },
      { label: "Programme", icon: "book-outline", amount: 5.0 },
      { label: "Museum Entry", icon: "camera-outline", amount: 10.0 },
    ],
  },
  {
    id: "fix_lfc",
    clubId: "liverpool",
    opponent: "Paris Saint-Germain",
    opponentAbbr: "PSG",
    isHome: true,
    venue: "Anfield",
    city: "Liverpool",
    dateTime: new Date(now + 20 * h).toISOString(),
    competition: "UEFA Champions League",
    matchweek: "Quarter-Final",
    stadiumOptions: [
      { label: "Food & Drinks", icon: "fast-food-outline", amount: 14.5 },
      { label: "Club Merch", icon: "bag-outline", amount: 32.0 },
      { label: "Programme", icon: "book-outline", amount: 5.0 },
      { label: "Parking", icon: "car-outline", amount: 12.0 },
    ],
  },
  {
    id: "fix_mufc",
    clubId: "man-utd",
    opponent: "Arsenal",
    opponentAbbr: "AFC",
    isHome: false,
    venue: "Emirates Stadium",
    city: "London",
    dateTime: new Date(now + 72 * h).toISOString(),
    competition: "Premier League",
    matchweek: "GW 37",
    stadiumOptions: [
      { label: "Food & Drinks", icon: "fast-food-outline", amount: 17.0 },
      { label: "Away Kit", icon: "bag-outline", amount: 45.0 },
      { label: "Programme", icon: "book-outline", amount: 5.0 },
      { label: "Parking", icon: "car-outline", amount: 15.0 },
    ],
  },
  {
    id: "fix_thfc",
    clubId: "tottenham",
    opponent: "Chelsea",
    opponentAbbr: "CFC",
    isHome: true,
    venue: "Tottenham Hotspur Stadium",
    city: "London",
    dateTime: new Date(now + 60 * h).toISOString(),
    competition: "Premier League",
    matchweek: "GW 38",
    stadiumOptions: [
      { label: "Food & Drinks", icon: "fast-food-outline", amount: 19.0 },
      { label: "Club Merch", icon: "bag-outline", amount: 38.0 },
      { label: "Programme", icon: "book-outline", amount: 5.0 },
      { label: "Parking", icon: "car-outline", amount: 15.0 },
    ],
  },
  {
    id: "fix_fcb",
    clubId: "barcelona",
    opponent: "Atletico Madrid",
    opponentAbbr: "ATM",
    isHome: true,
    venue: "Estadi Olímpic",
    city: "Barcelona",
    dateTime: new Date(now + 36 * h).toISOString(),
    competition: "La Liga",
    matchweek: "GW 38",
    stadiumOptions: [
      { label: "Tapas & Drinks", icon: "fast-food-outline", amount: 14.0 },
      { label: "Club Merch", icon: "bag-outline", amount: 42.0 },
      { label: "Programme", icon: "book-outline", amount: 4.0 },
      { label: "Museum Entry", icon: "camera-outline", amount: 12.0 },
    ],
  },
  {
    id: "fix_rma",
    clubId: "real-madrid",
    opponent: "Manchester City",
    opponentAbbr: "MCFC",
    isHome: false,
    venue: "Etihad Stadium",
    city: "Manchester",
    dateTime: new Date(now + 4 * h).toISOString(),
    competition: "UEFA Champions League",
    matchweek: "Final",
    stadiumOptions: [
      { label: "Food & Drinks", icon: "fast-food-outline", amount: 18.5 },
      { label: "Away Merch", icon: "bag-outline", amount: 40.0 },
      { label: "Programme", icon: "book-outline", amount: 5.0 },
      { label: "Parking", icon: "car-outline", amount: 15.0 },
    ],
  },
  {
    id: "fix_psg",
    clubId: "psg",
    opponent: "Liverpool",
    opponentAbbr: "LFC",
    isHome: false,
    venue: "Anfield",
    city: "Liverpool",
    dateTime: new Date(now + 20 * h).toISOString(),
    competition: "UEFA Champions League",
    matchweek: "Quarter-Final",
    stadiumOptions: [
      { label: "Food & Drinks", icon: "fast-food-outline", amount: 14.5 },
      { label: "Away Kit", icon: "bag-outline", amount: 38.0 },
      { label: "Programme", icon: "book-outline", amount: 5.0 },
      { label: "Parking", icon: "car-outline", amount: 12.0 },
    ],
  },
  {
    id: "fix_jfc",
    clubId: "juventus",
    opponent: "Inter Milan",
    opponentAbbr: "INT",
    isHome: true,
    venue: "Allianz Stadium",
    city: "Turin",
    dateTime: new Date(now + 48 * h).toISOString(),
    competition: "Serie A",
    matchweek: "GW 38",
    stadiumOptions: [
      { label: "Food & Drinks", icon: "fast-food-outline", amount: 13.0 },
      { label: "Club Merch", icon: "bag-outline", amount: 35.0 },
      { label: "Programme", icon: "book-outline", amount: 4.0 },
      { label: "Parking", icon: "car-outline", amount: 10.0 },
    ],
  },
  {
    id: "fix_bvb",
    clubId: "dortmund",
    opponent: "Bayer Leverkusen",
    opponentAbbr: "B04",
    isHome: true,
    venue: "Signal Iduna Park",
    city: "Dortmund",
    dateTime: new Date(now + 30 * h).toISOString(),
    competition: "Bundesliga",
    matchweek: "GW 34",
    stadiumOptions: [
      { label: "Bratwurst & Beer", icon: "fast-food-outline", amount: 11.0 },
      { label: "Club Merch", icon: "bag-outline", amount: 30.0 },
      { label: "Programme", icon: "book-outline", amount: 3.5 },
      { label: "Parking", icon: "car-outline", amount: 10.0 },
    ],
  },
  {
    id: "fix_fcba",
    clubId: "bayern",
    opponent: "Arsenal",
    opponentAbbr: "AFC",
    isHome: true,
    venue: "Allianz Arena",
    city: "Munich",
    dateTime: new Date(now + 28 * h).toISOString(),
    competition: "UEFA Champions League",
    matchweek: "Semi-Final",
    stadiumOptions: [
      { label: "Bratwurst & Beer", icon: "fast-food-outline", amount: 12.0 },
      { label: "Club Merch", icon: "bag-outline", amount: 36.0 },
      { label: "Programme", icon: "book-outline", amount: 4.0 },
      { label: "Parking", icon: "car-outline", amount: 12.0 },
    ],
  },
];

export function getFixtureForClub(clubId: string): Fixture | undefined {
  return FIXTURES.find((f) => f.clubId === clubId);
}

export function getTimeUntilMatch(dateTime: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isToday: boolean;
  isLive: boolean;
  isPast: boolean;
  totalSeconds: number;
} {
  const matchTime = new Date(dateTime).getTime();
  const now = Date.now();
  const diff = matchTime - now;

  if (diff < -7200000) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isToday: false, isLive: false, isPast: true, totalSeconds: 0 };
  }
  if (diff < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true, isLive: true, isPast: false, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isToday = days === 0;

  return { days, hours, minutes, seconds, isToday, isLive: false, isPast: false, totalSeconds };
}
