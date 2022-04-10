[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# rollup-plugin-import-assertions

🍣 A Rollup plugin which bundles [import assertions](https://github.com/tc39/proposal-import-assertions).

Two types of assertions are supported: `json` and `css`.

Currently, dynamic imports are not supported (PR welcomed).

## Install

Using npm:

```console
npm install rollup-plugin-import-assertions --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import importAssertions from 'rollup-plugin-import-assertions';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [importAssertions()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

With an accompanying file `src/index.js`, the local `package.json` file would now be importable as seen below:

```js
// src/index.js
import pkg from '../package.json' assert { type: 'json' };
console.log(`running version ${pkg.version}`);
```

It is also possible to import css stylesheets, typically when designing web components:

```js
// src/mycomponent.js
import style from './style.css' assert { type: 'css' };

class MyElement extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.adoptedStyleSheets = [styles];
    root.innerHTML = `<div>My custom element</div>`;
  }
}

customElements.define('my-element', MyElement);
```

## Options

For the `json` type of assertions, this plugin accepts the same options
as those of [@rollup/plugin-json](https://github.com/rollup/plugins/tree/master/packages/json/).
This makes it straight-forward to move to import assertions, should one wish so.

For the `css` type of assertions, this plugin accepts the usual `include` and `exclude` options.

### `compact` (type: 'json')

Type: `Boolean`<br>
Default: `false`

If `true`, instructs the plugin to ignore `indent` and generates the smallest code.

### `exclude`

Type: `String` | `Array[...String]`<br>
Default: `null`

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should _ignore_. By default no files are ignored.

### `include`

Type: `String` | `Array[...String]`<br>
Default: `null`

A [minimatch pattern](https://github.com/isaacs/minimatch), or array of patterns, which specifies the files in the build the plugin should operate on. By default all files are targeted.

### `indent` (type: 'json')

Type: `String`<br>
Default: `'\t'`

Specifies the indentation for the generated default export.

### `namedExports` (type: 'json')

Type: `Boolean`<br>
Default: `true`

If `true`, instructs the plugin to generate a named export for every property of the JSON object.

### `preferConst` (type: 'json')

Type: `Boolean`<br>
Default: `false`

If `true`, instructs the plugin to declare properties as variables, using either `var` or `const`. This pertains to tree-shaking.

## Credits

Credits to:

- [@rollup/plugin-json](https://github.com/rollup/plugins/tree/master/packages/json/),
  on top of which this plugin shamelessly builds.

- [rollup-plugin-import-assert](https://github.com/calebdwilliams/rollup-plugin-import-assert) which was inspirational to start with.

## License

![license](https://img.shields.io/github/license/swiing/rollup-plugin-import-assertions)
