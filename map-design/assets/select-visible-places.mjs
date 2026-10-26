// Derived from Hangzhou Slow Walk (MIT), copyright 2026 HainaHuang729.
// Candidate places have unique stable IDs and WGS84 lng/lat coordinates.
// displayRank is an editorial order: smaller finite numbers take precedence.
const rank = place => Number.isFinite(place.displayRank) ? place.displayRank : Infinity;

export function compareDisplayPriority(a, b) {
  return rank(a) - rank(b) || String(a.id).localeCompare(String(b.id));
}

export function selectVisiblePlaces(places, project, {selectedId = null, minDistance = 64} = {}) {
  const ordered = places.slice().sort((a, b) =>
    Number(b.id === selectedId) - Number(a.id === selectedId) || compareDisplayPriority(a, b));
  const kept = [];
  for (const place of ordered) {
    const point = project([place.lng, place.lat]);
    if (kept.some(other => Math.hypot(point.x - other.point.x, point.y - other.point.y) < minDistance)) continue;
    kept.push({place, point});
  }
  return kept.map(entry => entry.place);
}
