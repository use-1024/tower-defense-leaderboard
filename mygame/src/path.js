// ===================== PATH UTILITIES =====================
function getPositionOnPath(dist) {
  if (dist <= 0) return { x: waypointPixels[0].x, y: waypointPixels[0].y };
  if (dist >= totalPathLength) return { x: waypointPixels[waypointPixels.length-1].x, y: waypointPixels[waypointPixels.length-1].y };
  for (const seg of pathSegments) {
    if (dist <= seg.startDist + seg.len) {
      const t = (dist - seg.startDist) / seg.len;
      return { x: seg.ax + (seg.bx - seg.ax)*t, y: seg.ay + (seg.by - seg.ay)*t };
    }
  }
  return { x: waypointPixels[waypointPixels.length-1].x, y: waypointPixels[waypointPixels.length-1].y };
}
