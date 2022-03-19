// derived from https://github.com/rollup/plugins/blob/master/util/test.js

/**
 * @param {import('ava').Assertions} t
 * @param {import('rollup').RollupBuild} bundle
 * @param {object} args
 */
const testBundle = async (t, bundle, args = {}) => {
  const { output } = await bundle.generate({ format: 'cjs', exports: 'auto' });
  const [{ code }] = output;
  const module = { exports: {} };
  // as of 1/2/2020 Github Actions + Windows has changed in a way that we must now escape backslashes
  const cwd = process.cwd().replace(/\\/g, '\\\\');
  const params = ['module', 'exports', 'require', 't', ...Object.keys(args)].concat(
    `process.chdir('${cwd}'); let result;\n\n${code}\n\nreturn result;`
  );

  // eslint-disable-next-line no-new-func
  const func = new Function(...params);
  let error;
  let result;

  try {
    result = func(...[module, module.exports, require, t, ...Object.values(args)]);
  } catch (e) {
    error = e;
  }

  return { code, error, module, result };
};

module.exports = { testBundle };
