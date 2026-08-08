// Meeting times are typed by the requester in their own local clock and must
// resolve to one real instant, then be displayed to each viewer in their own
// timezone. `country` on profiles is free text, so this is a best-effort
// country -> IANA timezone lookup (large countries map to their most common zone).

const COUNTRY_TIMEZONES: Record<string, string> = {
  'united kingdom': 'Europe/London', uk: 'Europe/London', 'great britain': 'Europe/London',
  england: 'Europe/London', scotland: 'Europe/London', wales: 'Europe/London', 'northern ireland': 'Europe/London',
  'united states': 'America/New_York', usa: 'America/New_York', us: 'America/New_York', america: 'America/New_York',
  'united states of america': 'America/New_York',
  canada: 'America/Toronto',
  australia: 'Australia/Sydney',
  'new zealand': 'Pacific/Auckland',
  india: 'Asia/Kolkata',
  pakistan: 'Asia/Karachi',
  bangladesh: 'Asia/Dhaka',
  'sri lanka': 'Asia/Colombo',
  nepal: 'Asia/Kathmandu',
  'united arab emirates': 'Asia/Dubai', uae: 'Asia/Dubai',
  'saudi arabia': 'Asia/Riyadh',
  qatar: 'Asia/Qatar',
  kuwait: 'Asia/Kuwait',
  bahrain: 'Asia/Bahrain',
  oman: 'Asia/Muscat',
  singapore: 'Asia/Singapore',
  malaysia: 'Asia/Kuala_Lumpur',
  philippines: 'Asia/Manila',
  indonesia: 'Asia/Jakarta',
  china: 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  taiwan: 'Asia/Taipei',
  japan: 'Asia/Tokyo',
  'south korea': 'Asia/Seoul', korea: 'Asia/Seoul',
  thailand: 'Asia/Bangkok',
  vietnam: 'Asia/Ho_Chi_Minh',
  ireland: 'Europe/Dublin',
  france: 'Europe/Paris',
  germany: 'Europe/Berlin',
  spain: 'Europe/Madrid',
  italy: 'Europe/Rome',
  portugal: 'Europe/Lisbon',
  netherlands: 'Europe/Amsterdam',
  belgium: 'Europe/Brussels',
  switzerland: 'Europe/Zurich',
  austria: 'Europe/Vienna',
  sweden: 'Europe/Stockholm',
  norway: 'Europe/Oslo',
  denmark: 'Europe/Copenhagen',
  finland: 'Europe/Helsinki',
  poland: 'Europe/Warsaw',
  greece: 'Europe/Athens',
  russia: 'Europe/Moscow',
  turkey: 'Europe/Istanbul',
  israel: 'Asia/Jerusalem',
  'south africa': 'Africa/Johannesburg',
  nigeria: 'Africa/Lagos',
  kenya: 'Africa/Nairobi',
  ghana: 'Africa/Accra',
  egypt: 'Africa/Cairo',
  brazil: 'America/Sao_Paulo',
  mexico: 'America/Mexico_City',
  argentina: 'America/Argentina/Buenos_Aires',
  chile: 'America/Santiago',
  colombia: 'America/Bogota',
  peru: 'America/Lima',
  jamaica: 'America/Jamaica',
  trinidad: 'America/Port_of_Spain',
  'trinidad and tobago': 'America/Port_of_Spain',
  fiji: 'Pacific/Fiji',
}

function normalizeCountry(country: string): string {
  return country
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[.,]/g, '')
}

/** Best-effort IANA timezone for a free-text country name. Falls back to UTC. */
export function countryToTimezone(country: string | null | undefined): string {
  if (!country) return 'UTC'
  const key = normalizeCountry(country)
  return COUNTRY_TIMEZONES[key] ?? 'UTC'
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const asUTC = Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(map.hour), Number(map.minute), Number(map.second)
  )
  return asUTC - date.getTime()
}

/** Converts a wall-clock date+time meant in `timeZone` into the real UTC instant. */
export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number)
  const utcGuess = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0))
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone)
  return new Date(utcGuess.getTime() - offset)
}

/** Formats an absolute instant for display in a given viewer's timezone. */
export function formatInTimezone(date: Date, timeZone: string): { dateStr: string; timeStr: string; tzLabel: string } {
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone })
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone })
  const tzParts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(date)
  const tzLabel = tzParts.find(p => p.type === 'timeZoneName')?.value ?? timeZone
  return { dateStr, timeStr, tzLabel }
}
