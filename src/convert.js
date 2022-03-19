// This is originally from https://www.npmjs.com/package/string-to-template-literal
// however this package does not expose cjs modules, which is needed by this plugin
// for testing.

const illegalChars = new Map();
illegalChars.set('\\', '\\\\');
illegalChars.set('`', '\\`');
illegalChars.set('$', '\\$');

export default function convert(s) {
  if (!s) {
    return '``';
  }

  let res = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i);
    res += illegalChars.get(c) || c;
  }
  return `\`${res}\``;
}
