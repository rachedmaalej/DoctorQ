/**
 * Lightweight ICS (iCalendar) parser for extracting VEVENT data.
 * Handles both UTC and TZID datetime formats from Doctolib exports.
 */

export interface ParsedEvent {
  startTime: Date;
  endTime: Date;
  summary: string;
}

/**
 * Parse DTSTART/DTEND value — supports:
 *   20260309T090000Z           (UTC)
 *   20260309T090000            (local, no Z)
 *   TZID=Europe/Paris:20260309T090000
 */
function parseIcsDateTime(raw: string): Date | null {
  // Strip TZID prefix if present: "TZID=Europe/Paris:20260309T090000"
  const colonIdx = raw.indexOf(':');
  const dateStr = colonIdx !== -1 && raw.includes('TZID') ? raw.slice(colonIdx + 1) : raw;
  const clean = dateStr.trim();

  // Match: YYYYMMDDTHHmmss[Z]
  const m = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;

  const [, year, month, day, hour, min, sec, utcFlag] = m;
  if (utcFlag === 'Z') {
    return new Date(Date.UTC(+year, +month - 1, +day, +hour, +min, +sec));
  }
  // Treat as local time
  return new Date(+year, +month - 1, +day, +hour, +min, +sec);
}

/**
 * Extract a property value from a VEVENT block.
 * Handles both "PROP:value" and "PROP;params:value" formats.
 */
function extractProperty(block: string, prop: string): string | null {
  // Match: PROP:value or PROP;anything:value
  const regex = new RegExp(`^${prop}[;:](.+)$`, 'm');
  const match = block.match(regex);
  if (!match) return null;
  // For "PROP;TZID=...:value", return everything after PROP (including ;TZID part)
  return match[1].trim();
}

/**
 * Parse an ICS file and extract events, optionally filtering to a specific date.
 */
export function parseIcsFile(icsContent: string, filterDate?: Date): ParsedEvent[] {
  const events: ParsedEvent[] = [];

  // Unfold lines (ICS spec: continuation lines start with space/tab)
  const unfolded = icsContent.replace(/\r?\n[ \t]/g, '');

  // Split into VEVENT blocks
  const blocks = unfolded.split('BEGIN:VEVENT');

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    if (!block) continue;

    const dtStartRaw = extractProperty(block, 'DTSTART');
    const dtEndRaw = extractProperty(block, 'DTEND');
    const summary = extractProperty(block, 'SUMMARY');

    if (!dtStartRaw) continue;

    const startTime = parseIcsDateTime(dtStartRaw);
    if (!startTime) continue;

    let endTime: Date;
    if (dtEndRaw) {
      const parsed = parseIcsDateTime(dtEndRaw);
      endTime = parsed ?? new Date(startTime.getTime() + 30 * 60 * 1000);
    } else {
      endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    }

    // Filter by date if specified
    if (filterDate) {
      const sameDay =
        startTime.getFullYear() === filterDate.getFullYear() &&
        startTime.getMonth() === filterDate.getMonth() &&
        startTime.getDate() === filterDate.getDate();
      if (!sameDay) continue;
    }

    events.push({
      startTime,
      endTime,
      summary: summary ?? '',
    });
  }

  // Sort by start time
  events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  return events;
}
