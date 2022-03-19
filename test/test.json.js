const { readFileSync } = require('fs');

const test = require('ava');

const { rollup } = require('rollup');

const { nodeResolve } = require('@rollup/plugin-node-resolve');

const acorn = require('acorn');

const importAssertions = require('../dist'); // eslint-disable-line import/no-unresolved

// require('../../../util/test');
const { testBundle } = require('./util.js');

const read = (file) => readFileSync(file, 'utf-8');

require('source-map-support').install();

process.chdir(__dirname);

test('converts json', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.js',
    plugins: [importAssertions()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('handles arrays', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/array/main.js',
    plugins: [importAssertions()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('handles literals', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/literal/main.js',
    plugins: [importAssertions()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('generates named exports', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/named/main.js',
    plugins: [importAssertions()]
  });

  const { code, result } = await testBundle(t, bundle, { exports: {} });

  t.is(result.version, '1.33.7');
  t.is(code.indexOf('this-should-be-excluded'), -1, 'should exclude unused properties');
});

test('resolves extensionless imports in conjunction with the node-resolve plugin', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/extensionless/main.js',
    plugins: [nodeResolve({ extensions: ['.js', '.json'] }), importAssertions()]
  });
  t.plan(2);
  return testBundle(t, bundle);
});

test('handles JSON objects with no valid keys (#19)', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/no-valid-keys/main.js',
    plugins: [importAssertions()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

// This passes, however it has 1 unhandled rejection
// which triggers in rollup/dist/shared/rollup.js line 12803 TryParse()
// which will indeed fail to parse a wrong json file.
// This is fine but how comes the rollup-plugin-json does not trigger
// this code? Probably due to the asynch nature of the code. To be checked...
test('handles garbage', async (t) => {
  const warns = [];

  await rollup({
    input: 'fixtures/garbage/main.js',
    plugins: [importAssertions()],
    onwarn: (warning) => warns.push(warning)
  }).catch(() => {});

  const [{ message, id, position, plugin }] = warns;

  t.is(warns.length, 1);
  t.is(plugin, 'import-assertions');
  t.is(position, 1);
  t.is(message, 'Could not parse JSON file');
  t.regex(id, /(.*)bad.json$/);
});

/**
 *
 */

const transform = (fixture, options = {}) =>
  importAssertions(options).transform.call(
    {
      parse: (code) =>
        acorn.parse(code, {
          ecmaVersion: 6
        }),
      getModuleInfo: () => {
        return {
          meta: { 'import-assertions': 'json' }
        };
      }
    },
    fixture,
    'input.json'
  );

test('does not generate an AST', async (t) => {
  // eslint-disable-next-line no-undefined
  t.is((await transform(read('fixtures/form/input.json'))).ast, undefined);
});

test('does not generate source maps', async (t) => {
  t.deepEqual((await transform(read('fixtures/form/input.json'))).map, {
    mappings: ''
  });
});

test('generates properly formatted code', async (t) => {
  const { code } = await transform(read('fixtures/form/input.json'));
  t.snapshot(code);
});

test('generates correct code with preferConst', async (t) => {
  const { code } = await transform(read('fixtures/form/input.json'), { preferConst: true });
  t.snapshot(code);
});

test('uses custom indent string', async (t) => {
  const { code } = await transform(read('fixtures/form/input.json'), { indent: '  ' });
  t.snapshot(code);
});

test('generates correct code with compact=true', async (t) => {
  const { code } = await transform(
    read('fixtures/form/input.json'),
    { compact: true },
    'input.json'
  );
  t.snapshot(code);
});

test('generates correct code with namedExports=false', async (t) => {
  const { code } = await transform(
    read('fixtures/form/input.json'),
    { namedExports: false },
    'input.json'
  );
  t.snapshot(code);
});

test('correctly formats arrays with compact=true', async (t) => {
  const { code } = await transform(
    `[
1,
{
"x": 1
}
]`,
    { compact: true },
    'input.json'
  );
  t.deepEqual(code, 'export default[1,{x:1}];');
});

test('handles empty keys', async (t) => {
  const { code } = await transform(`{"":"a", "b": "c"}`);
  t.deepEqual(code, 'export var b = "c";\nexport default {\n\t"": "a",\n\tb: b\n};\n');
});
