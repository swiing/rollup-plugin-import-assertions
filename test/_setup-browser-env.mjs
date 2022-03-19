// import browserEnv from 'browser-env';
// browserEnv(['CSSStyleSheet']);

// browserEnv ultimately relies on [cssom](https://github.com/NV/CSSOM)
// for CSSStyleSheet, however the latter is unmaintained and does not support
// .replaceSync(). Hence I need to manually mock.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
global.CSSStyleSheet = class CSSStyleSheet {
  // eslint-disable-next-line class-methods-use-this
  replaceSync() {}
};
