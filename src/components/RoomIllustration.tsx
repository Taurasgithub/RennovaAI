import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { CEILINGS, FLOORING, PALETTES, STYLES, findById } from '../data/catalog';

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

export type RoomLook = {
  paletteId?: string;
  styleId?: string;
  flooringId?: string;
  ceilingId?: string;
  extras?: string[];
  worn?: boolean; // the "before" state
};

const W = 400;
const H = 280;

/**
 * A vector "sample room" used when the user has not uploaded a photo, and for
 * vendor portfolio thumbnails. Every surface is driven by the design choices,
 * so the preview updates live as the user picks colours and materials.
 */
export function RoomIllustration({ paletteId, styleId, flooringId = 'keep', ceilingId = 'keep', extras = [], worn }: RoomLook) {
  const pal = findById(PALETTES, paletteId);
  const style = findById(STYLES, styleId);
  const floor = findById(FLOORING, flooringId);
  const ceiling = findById(CEILINGS, ceilingId);

  const wall = worn ? '#CFC6B4' : pal.wall;
  const accent = worn ? '#8F8574' : pal.accent;
  const trim = worn ? '#E6E0D2' : pal.trim;
  const furniture = worn ? '#8D8273' : style.furniture;
  const floorCol = worn ? '#B9A88F' : floor.colour ?? '#C9B8A0';
  const ceilCol = worn ? '#E2DCCD' : shade(trim, -0.04);

  const has = (id: string) => !worn && extras.includes(id);
  const cove = !worn && ceiling.id === 'cove';
  const gypsum = !worn && (ceiling.id === 'gypsum' || ceiling.id === 'cove');
  const woodCeil = !worn && ceiling.id === 'wood';
  const planks = !worn && (floor.id === 'laminate' || floor.id === 'vinyl');
  const tiles = !worn && (floor.id === 'porcelain' || floor.id === 'marble');

  // Converging floor lines toward the vanishing point
  // Floor lines run from the back edge (80→320) to the front edge (0→400), staying inside the floor.
  const plankLines = Array.from({ length: 9 }, (_, i) => ({ x1: 80 + 30 * i, y1: 190, x2: 50 * i, y2: H }));
  const tileRows = [205, 225, 251];

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFD58A" stopOpacity={0.75} />
          <Stop offset="1" stopColor="#FFD58A" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="floorShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#BFE3F2" />
          <Stop offset="1" stopColor="#E9F6FB" />
        </LinearGradient>
      </Defs>

      {/* Ceiling */}
      <Polygon points="0,0 400,0 320,50 80,50" fill={ceilCol} />
      {gypsum && <Polygon points="40,10 360,10 300,42 100,42" fill={shade(ceilCol, 0.5)} stroke={shade(ceilCol, -0.08)} strokeWidth={1} />}
      {gypsum && [130, 200, 270].map((x) => <Ellipse key={x} cx={x} cy={26} rx={6} ry={2.5} fill="#FFF6DA" />)}
      {woodCeil && Array.from({ length: 14 }, (_, i) => <Line key={i} x1={i * 30} y1={0} x2={80 + i * 17.5} y2={50} stroke="#8B5E3C" strokeWidth={5} />)}

      {/* Walls */}
      <Polygon points="0,0 80,50 80,190 0,280" fill={shade(wall, -0.1)} />
      <Polygon points="400,0 320,50 320,190 400,280" fill={shade(wall, -0.16)} />
      <Rect x={80} y={50} width={240} height={140} fill={wall} />
      {cove && <Rect x={80} y={50} width={240} height={46} fill="url(#glow)" />}
      {cove && <Line x1={80} y1={51} x2={320} y2={51} stroke="#FFE2A8" strokeWidth={2.5} />}

      {/* Feature wall panelling */}
      {has('panelling') && (
        <G>
          <Rect x={246} y={50} width={74} height={140} fill="#7A5134" />
          {Array.from({ length: 9 }, (_, i) => (
            <Rect key={i} x={249 + i * 8} y={50} width={4.5} height={140} fill="#9A6B47" />
          ))}
        </G>
      )}

      {/* Worn stains / cracks for the before state */}
      {worn && (
        <G opacity={0.45}>
          <Ellipse cx={120} cy={80} rx={22} ry={12} fill="#A89B82" />
          <Ellipse cx={290} cy={150} rx={16} ry={20} fill="#A89B82" />
          <Path d="M210 55 L214 70 L208 82 L215 98" stroke="#8F836B" strokeWidth={1.4} fill="none" />
          <Ellipse cx={30} cy={120} rx={14} ry={24} fill="#9E9078" />
        </G>
      )}

      {/* Window on left wall */}
      <Polygon points="16,62 62,86 62,158 16,184" fill={trim} />
      <Polygon points="21,70 57,89 57,153 21,176" fill="url(#sky)" />
      <Line x1={39} y1={79} x2={39} y2={165} stroke={trim} strokeWidth={3} />
      <Line x1={21} y1={123} x2={57} y2={121} stroke={trim} strokeWidth={3} />
      {has('decor') && (
        <G>
          <Polygon points="10,52 26,60 26,196 10,206" fill={accent} opacity={0.9} />
          <Polygon points="58,80 68,85 68,166 58,172" fill={accent} opacity={0.9} />
        </G>
      )}

      {/* Floor */}
      <Polygon points="80,190 320,190 400,280 0,280" fill={floorCol} />
      {planks && plankLines.map((l, i) => <Line key={i} {...l} stroke={shade(floorCol, -0.18)} strokeWidth={1} />)}
      {tiles && (
        <G>
          {plankLines.filter((_, i) => i % 2 === 0).map((l, i) => <Line key={i} {...l} stroke={shade(floorCol, -0.12)} strokeWidth={1} />)}
          {tileRows.map((y) => {
            const t = (y - 190) / 90;
            return <Line key={y} x1={80 - 80 * t} y1={y} x2={320 + 80 * t} y2={y} stroke={shade(floorCol, -0.12)} strokeWidth={1} />;
          })}
        </G>
      )}
      {!worn && floor.id === 'marble' && (
        <Path d="M60 270 C 120 240, 150 250, 210 220 S 300 230, 340 205" stroke="#D9D4CA" strokeWidth={1.5} fill="none" />
      )}
      <Polygon points="80,190 320,190 400,280 0,280" fill="url(#floorShade)" />
      {/* Skirting */}
      <Rect x={80} y={186} width={240} height={4} fill={shade(trim, -0.1)} />

      {/* Rug */}
      <Polygon points="135,206 265,206 300,250 100,250" fill={accent} opacity={worn ? 0.25 : 0.35} />

      {/* Wall art */}
      {!worn && (
        <G>
          <Rect x={168} y={74} width={64} height={42} fill={trim} stroke={shade(accent, -0.2)} strokeWidth={2} />
          <Path d="M172 110 L190 92 L202 104 L212 96 L228 110 Z" fill={accent} opacity={0.85} />
          <Circle cx={214} cy={86} r={5} fill="#FEA923" />
        </G>
      )}

      {/* Sofa */}
      <G>
        <Rect x={128} y={128} width={144} height={30} rx={8} fill={shade(furniture, -0.08)} />
        <Rect x={120} y={150} width={160} height={34} rx={8} fill={furniture} />
        <Rect x={114} y={140} width={18} height={44} rx={7} fill={shade(furniture, -0.12)} />
        <Rect x={268} y={140} width={18} height={44} rx={7} fill={shade(furniture, -0.12)} />
        <Rect x={124} y={184} width={6} height={8} fill="#3B3B3B" />
        <Rect x={270} y={184} width={6} height={8} fill="#3B3B3B" />
        {!worn && (
          <G>
            <Rect x={140} y={134} width={30} height={22} rx={6} fill={accent} />
            <Rect x={230} y={134} width={30} height={22} rx={6} fill="#FEA923" />
          </G>
        )}
      </G>

      {/* Coffee table */}
      <Ellipse cx={200} cy={222} rx={42} ry={9} fill={worn ? '#6F6556' : shade(furniture, -0.3)} />
      <Rect x={196} y={222} width={8} height={14} fill={worn ? '#5D5447' : shade(furniture, -0.4)} />

      {/* Plant */}
      {!worn && (
        <G>
          <Rect x={296} y={166} width={20} height={22} rx={4} fill={trim} stroke={shade(trim, -0.2)} />
          <Circle cx={300} cy={158} r={9} fill="#3E8E5A" />
          <Circle cx={313} cy={154} r={10} fill="#2F7A4B" />
          <Circle cx={306} cy={146} r={9} fill="#4FA56B" />
        </G>
      )}

      {/* Pendant lighting */}
      {has('lighting') && (
        <G>
          <Line x1={200} y1={0} x2={200} y2={36} stroke="#333" strokeWidth={1.2} />
          <Path d="M188 44 Q200 30 212 44 Z" fill="#222" />
          <Ellipse cx={200} cy={46} rx={10} ry={3} fill="#FFE2A8" />
          <Polygon points="190,46 210,46 240,120 160,120" fill="#FFE2A8" opacity={0.18} />
        </G>
      )}

      {/* Built-in woodwork */}
      {has('woodwork') && (
        <G>
          <Rect x={84} y={110} width={30} height={78} fill="#8B5E3C" />
          <Line x1={84} y1={135} x2={114} y2={135} stroke="#6E472C" />
          <Line x1={84} y1={160} x2={114} y2={160} stroke="#6E472C" />
        </G>
      )}
    </Svg>
  );
}
