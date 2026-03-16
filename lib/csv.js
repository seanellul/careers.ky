// Lightweight CSV parser tailored for our datasets (handles quotes, commas, newlines)
// Returns: { headers: string[], rows: Array<Record<string,string>> }
export function parseCSV(text) {
  if (!text || typeof text !== "string") return { headers: [], rows: [] };
  const rows = [];
  const headers = [];

  let i = 0;
  const len = text.length;
  let cell = "";
  let row = [];
  let inQuotes = false;
  let sawCR = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    // Skip empty trailing lines
    if (row.length === 1 && row[0] === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  while (i < len) {
    const ch = text[i++];
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote
        if (text[i] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { pushCell(); }
      else if (ch === '\n') { pushCell(); pushRow(); sawCR = false; }
      else if (ch === '\r') { pushCell(); pushRow(); sawCR = true; if (text[i] === '\n') i++; }
      else { cell += ch; sawCR = false; }
    }
  }
  // Final cell/row
  pushCell();
  if (row.length) pushRow();

  if (!rows.length) return { headers: [], rows: [] };
  const headerRow = rows[0];
  for (let h of headerRow) headers.push(String(h || '').trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const record = {};
    const cur = rows[r];
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = String(cur[c] ?? "").trim();
    }
    out.push(record);
  }
  return { headers, rows: out };
}

export function indexBy(records, key) {
  const map = new Map();
  for (const rec of records || []) {
    const k = rec?.[key];
    if (k !== undefined) map.set(String(k), rec);
  }
  return map;
}

export function groupBy(records, key) {
  const map = new Map();
  for (const rec of records || []) {
    const k = String(rec?.[key] ?? "");
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(rec);
  }
  return map;
}


