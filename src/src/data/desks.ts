export type Floor = 'ground' | 'first'

export interface Desk {
  id: string
  name: string
  floor: Floor
  neighbourhood: string
  x: number // % of image width
  y: number // % of image height
}

// 2×2 = 4 desks
function c4(id: string, floor: Floor, nb: string, cx: number, cy: number): Desk[] {
  return [
    { id: `${id}-tl`, name: `${id}-TL`, floor, neighbourhood: nb, x: cx - 1.5, y: cy - 2 },
    { id: `${id}-tr`, name: `${id}-TR`, floor, neighbourhood: nb, x: cx + 1.5, y: cy - 2 },
    { id: `${id}-bl`, name: `${id}-BL`, floor, neighbourhood: nb, x: cx - 1.5, y: cy + 2 },
    { id: `${id}-br`, name: `${id}-BR`, floor, neighbourhood: nb, x: cx + 1.5, y: cy + 2 },
  ]
}

// 2 wide × 3 deep = 6 desks (portrait)
function c6(id: string, floor: Floor, nb: string, cx: number, cy: number): Desk[] {
  return [
    { id: `${id}-t1`, name: `${id}-T1`, floor, neighbourhood: nb, x: cx - 2, y: cy - 3 },
    { id: `${id}-t2`, name: `${id}-T2`, floor, neighbourhood: nb, x: cx + 2, y: cy - 3 },
    { id: `${id}-m1`, name: `${id}-M1`, floor, neighbourhood: nb, x: cx - 2, y: cy },
    { id: `${id}-m2`, name: `${id}-M2`, floor, neighbourhood: nb, x: cx + 2, y: cy },
    { id: `${id}-b1`, name: `${id}-B1`, floor, neighbourhood: nb, x: cx - 2, y: cy + 3 },
    { id: `${id}-b2`, name: `${id}-B2`, floor, neighbourhood: nb, x: cx + 2, y: cy + 3 },
  ]
}

// 3 wide × 2 deep = 6 desks (landscape)
function c6l(id: string, floor: Floor, nb: string, cx: number, cy: number): Desk[] {
  return [
    { id: `${id}-tl`, name: `${id}-TL`, floor, neighbourhood: nb, x: cx - 3.5, y: cy - 2 },
    { id: `${id}-tm`, name: `${id}-TM`, floor, neighbourhood: nb, x: cx,       y: cy - 2 },
    { id: `${id}-tr`, name: `${id}-TR`, floor, neighbourhood: nb, x: cx + 3.5, y: cy - 2 },
    { id: `${id}-bl`, name: `${id}-BL`, floor, neighbourhood: nb, x: cx - 3.5, y: cy + 2 },
    { id: `${id}-bm`, name: `${id}-BM`, floor, neighbourhood: nb, x: cx,       y: cy + 2 },
    { id: `${id}-br`, name: `${id}-BR`, floor, neighbourhood: nb, x: cx + 3.5, y: cy + 2 },
  ]
}

export const DESKS: Desk[] = [

  // ── GROUND: WINDOWS — 4 banks (2×2), each bank 3 wide × 2 deep (c6l) ─────
  ...c6l('g-w-b1', 'ground', 'Windows', 11, 12),
  ...c6l('g-w-b2', 'ground', 'Windows', 24, 12),
  ...c6l('g-w-b3', 'ground', 'Windows', 11, 24.5),
  ...c6l('g-w-b4', 'ground', 'Windows', 24, 24.5),

  // ── GROUND: SECURITY — 4 banks (2×2), each bank 3 wide × 2 deep (c6l) ────
  ...c6l('g-sec-b1', 'ground', 'Security', 77,   12),
  ...c6l('g-sec-b2', 'ground', 'Security', 90,   12),
  ...c6l('g-sec-b3', 'ground', 'Security', 77,   24.5),
  ...c6l('g-sec-b4', 'ground', 'Security', 90,   24.5),

  // ── GROUND: VIRTUALISATION — left side, 6-desk portrait, 2 col × 3 row ───
  ...c6('g-vir-r1c1', 'ground', 'Virtualisation',  7, 39),
  ...c6('g-vir-r1c2', 'ground', 'Virtualisation', 18, 39),
  ...c6('g-vir-r2c1', 'ground', 'Virtualisation',  7, 53),
  ...c6('g-vir-r2c2', 'ground', 'Virtualisation', 18, 53),
  ...c6('g-vir-r3c1', 'ground', 'Virtualisation',  7, 67),
  ...c6('g-vir-r3c2', 'ground', 'Virtualisation', 18, 67),

  // ── GROUND: SUPPORT — right side, 6-desk portrait, 3 col × 3 row ─────────
  ...c6('g-sup-r1c1', 'ground', 'Support', 71, 36),
  ...c6('g-sup-r1c2', 'ground', 'Support', 81, 36),
  ...c6('g-sup-r1c3', 'ground', 'Support', 91, 36),
  ...c6('g-sup-r2c1', 'ground', 'Support', 71, 51),
  ...c6('g-sup-r2c2', 'ground', 'Support', 81, 51),
  ...c6('g-sup-r2c3', 'ground', 'Support', 91, 51),
  ...c6('g-sup-r3c1', 'ground', 'Support', 71, 66),
  ...c6('g-sup-r3c2', 'ground', 'Support', 81, 66),
  ...c6('g-sup-r3c3', 'ground', 'Support', 91, 66),

  // ── FIRST: top-left open area, 4-desk, 3×2 ───────────────────────────────
  ...c4('f-nw-r1c1', 'first', 'Open Plan',  6, 10),
  ...c4('f-nw-r1c2', 'first', 'Open Plan', 14, 10),
  ...c4('f-nw-r1c3', 'first', 'Open Plan', 21, 10),
  ...c4('f-nw-r2c1', 'first', 'Open Plan',  6, 20),
  ...c4('f-nw-r2c2', 'first', 'Open Plan', 14, 20),
  ...c4('f-nw-r2c3', 'first', 'Open Plan', 21, 20),

  // ── FIRST: top-right open area (starts ~x:65%), 4-desk, 3×2 ─────────────
  ...c4('f-ne-r1c1', 'first', 'Open Plan', 67, 10),
  ...c4('f-ne-r1c2', 'first', 'Open Plan', 76, 10),
  ...c4('f-ne-r1c3', 'first', 'Open Plan', 85, 10),
  ...c4('f-ne-r2c1', 'first', 'Open Plan', 67, 20),
  ...c4('f-ne-r2c2', 'first', 'Open Plan', 76, 20),
  ...c4('f-ne-r2c3', 'first', 'Open Plan', 85, 20),

  // ── FIRST: left open area, 6-desk portrait, 2×3 ──────────────────────────
  ...c6('f-w-r1c1', 'first', 'Open Plan',  7, 39),
  ...c6('f-w-r1c2', 'first', 'Open Plan', 18, 39),
  ...c6('f-w-r2c1', 'first', 'Open Plan',  7, 53),
  ...c6('f-w-r2c2', 'first', 'Open Plan', 18, 53),
  ...c6('f-w-r3c1', 'first', 'Open Plan',  7, 67),
  ...c6('f-w-r3c2', 'first', 'Open Plan', 18, 67),

  // ── FIRST: right open area (avoids staircase ~x:63–72%), 6-desk, 3×3 ─────
  ...c6('f-e-r1c1', 'first', 'Open Plan', 74, 36),
  ...c6('f-e-r1c2', 'first', 'Open Plan', 84, 36),
  ...c6('f-e-r1c3', 'first', 'Open Plan', 93, 36),
  ...c6('f-e-r2c1', 'first', 'Open Plan', 74, 51),
  ...c6('f-e-r2c2', 'first', 'Open Plan', 84, 51),
  ...c6('f-e-r2c3', 'first', 'Open Plan', 93, 51),
  ...c6('f-e-r3c1', 'first', 'Open Plan', 74, 66),
  ...c6('f-e-r3c2', 'first', 'Open Plan', 84, 66),
  ...c6('f-e-r3c3', 'first', 'Open Plan', 93, 66),
]

export const getDesksByFloor = (floor: Floor) => DESKS.filter(d => d.floor === floor)
export const getDeskById = (id: string) => DESKS.find(d => d.id === id)
