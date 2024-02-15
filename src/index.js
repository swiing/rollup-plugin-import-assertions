/**
 * copyright 2022 swiing
 * SPDX-License-Identifier: MIT
 */

import { importAssertions as acornImportAssertions } from 'acorn-import-assertions';
import { createFilter, dataToEsm } from '@rollup/pluginutils';
import { walk } from 'estree-walker';

import convert from './convert';

// Implementation principle:
//
// When a module is processed, we look for import assertions;
// for each one found, we attach adhoc information to the corresponding module.
// When a module is transformed, we check for such adhoc information;
// if present, we transform accordingly.
//
// In rollup v2, adhoc information is set/found in `meta: { 'import-assertions': <type> }`
// In rollup v3, there is some support of import assertions, so we leverage this.
// In that case, adhoc information is set/found in `assertions : { type: <type> }`
//
// Supported meta information is "json" and "css".

// options are same as for @rollup/plugin-json
// see https://github.com/rollup/plugins/tree/master/packages/json
export default function importAssertions(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const indent = 'indent' in options ? options.indent : '\t';
  const treatAsExternal = [];

  return {
    name: 'import-assertions',

    // we want to make sure acorn knows how to parse import assertions

    // For rollup v2 or v2,
    // the acorn parser only implements stage 4 js proposals.
    // At the moment "import assertions" are a stage 3 proposal and as such
    // cannot be parsed by acorn. However, there exist a plugin,
    // so we inject the adhoc plugin into the options
    // by leveraging https://rollupjs.org/guide/en/#acorninjectplugins
    options(opts) {
      const rollupMajorVersion = Number(this.meta.rollupVersion.split('.')[0]);

      if (rollupMajorVersion <= 3) {
        // eslint-disable-next-line no-param-reassign
        opts.acornInjectPlugins = opts.acornInjectPlugins || [];
        if (!opts.acornInjectPlugins.includes(acornImportAssertions)) {
          opts.acornInjectPlugins.push(acornImportAssertions);
        }
      }

      return opts;
    },

    resolveId(source, importer) {
      if (importer in treatAsExternal && treatAsExternal[importer].has(source)) {
        this.warn(`treating ${source} as an external dependency`);
        return false;
      }
      return null;
    },

    async transform(inputCode, id) {
      if (!filter(id)) return null;

      const self = this;

      const moduleInfo = self.getModuleInfo(id);
      const assertType =
        'attributes' in moduleInfo
          ? moduleInfo.attributes.type /* rollup v4 */
          : 'assertions' in moduleInfo
          ? moduleInfo.assertions.type /* rollup v3 */
          : moduleInfo.meta['import-assertions']; /* rollup v<=2 */

      if (assertType === 'json')
        // from @rollup/plugin-json
        try {
          const parsed = JSON.parse(inputCode);
          const code = dataToEsm(parsed, {
            preferConst: options.preferConst,
            compact: options.compact,
            namedExports: options.namedExports,
            indent
          });
          return {
            code,
            map: { mappings: '' }
          };
        } catch (err) {
          const message = 'Could not parse JSON file';
          const position = parseInt(/[\d]/.exec(err.message)[0], 10);
          this.warn({ message, id, position });
          return null;
        }
      else if (assertType === 'css') {
        const code = `let sheet;
try {
  sheet = new CSSStyleSheet()
  sheet.replaceSync(${convert(inputCode)});
} catch(err) {
  console.error('Constructable Stylesheets are not supported in your environment. Please consider a polyfill, e.g. https://www.npmjs.com/package/construct-style-sheets-polyfill')
}
export default sheet;`;
        return {
          code,
          map: { mappings: '' }
        };
      }

      // else assume some sort of js
      const declarations = [];
      let ast;
      try {
        ast = this.parse(inputCode);
        walk(ast, {
          enter(node) {
            if (
              ['ImportDeclaration', 'ExportNamedDeclaration'].includes(node.type) &&
              node.assertions
            ) {
              // As per https://github.com/xtuc/acorn-import-assertions/blob/main/src/index.js#L167
              // an import assertions node has (amongst others):
              // - a source node, whose value is the path
              const sourceNode = node.source;
              // - an (array of) assertions node, whose value is a Literal node, whose value is the type (i.e. "json"|"css")
              const literalNode = node.assertions[0].value;
              declarations.push({ source: sourceNode.value, type: literalNode.value });
            }
          }
        });
      } catch (err) {
        return null;
      }

      // attach meta information to the module
      // Note: it is important to await here: this makes sure rollup does not process imports
      // before the meta info is attached to the modules (by means of rollup waiting
      // the transform() hook to resolve before processing imports)
      // https://rollupjs.org/guide/en/#build-hooks
      await Promise.all(
        declarations.map(async ({ source, type }) => {
          // { assertions } is used by rollup v3 (ignored by rollup v2)
          const resolvedId = await self.resolve(source, id, { assertions: { type } });

          if (!resolvedId) {
            this.warn('Unresolved dependencies');
            if (!(id in treatAsExternal)) treatAsExternal[id] = new Set();
            treatAsExternal[id].add(source);
            return;
          }
          if (resolvedId.external) return;

          const meta = { 'import-assertions': type };
          const moduleInfo = this.getModuleInfo(resolvedId.id);
          // case where the module has not been loaded yet.
          if (!moduleInfo) {
            self
              .load({ ...resolvedId, meta })
              // errors parsing the file are already captured, so don't repeat error
              // https://github.com/rollup/rollup/blob/275dc2fa34e1aaad37a29360570dc85b1ba019a6/src/Module.ts#L837
              // Question: could it be though that load() rejects for an error type
              // other than parsing?
              .catch(() => {});
          }
          // case where the module has already been loaded (e.g. by another plugin)
          else {
            moduleInfo.meta = { ...moduleInfo.meta, ...meta };
          }
        })
      );

      return null;
    }
  };
}
