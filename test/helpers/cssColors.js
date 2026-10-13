// Finds colour literals in CSS declaration values: hex, every CSS colour
// function and every named colour. Token references (var(--x)) and keywords
// such as transparent or currentColor are allowed.
const NAMED = `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred
darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray
green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen
lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink
lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen
linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy
oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip
peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal
thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(/\s+/);

const FUNCTION_RE = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/gi;
const HEX_RE = /#[0-9a-f]{3,8}\b/gi;
const NAMED_RE = new RegExp(`(?<![-\\w#.])(?:${NAMED.join('|')})(?![-\\w(])`, 'gi');

/** Every colour literal in the declaration values of a CSS string. */
export function colourLiterals(css) {
  const values = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/:\s*([^;{}]+)(?=[;}])/g)].map((m) => m[1]);
  const found = [];
  for (const value of values) {
    // A colour function is fine only when its channels come from a token.
    for (const m of value.matchAll(FUNCTION_RE)) {
      const start = m.index + m[0].length;
      const args = value.slice(start, value.indexOf(')', start));
      if (!/^\s*var\(--/.test(args)) found.push(`${m[0]}${args})`);
    }
    for (const m of value.matchAll(HEX_RE)) found.push(m[0]);
    for (const m of value.replace(/url\([^)]*\)|"[^"]*"|'[^']*'/g, '').matchAll(NAMED_RE)) found.push(m[0]);
  }
  return found;
}
