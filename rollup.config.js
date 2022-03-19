const pkg = require('./package.json');

const external = Object.keys(pkg.dependencies);

export default {
  input: 'src/index.js',
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'auto' },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  external
};
