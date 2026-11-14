/* eslint-disable @typescript-eslint/no-require-imports */
// App entry. `require` (not `import`) keeps the order: imports are hoisted, and the
// React DevTools hook below must be installed before React loads.

// React inspection/profiling tools for chrome-devtools-mcp. Dev builds in a browser only:
// the package throws outside a browser, so it is skipped on iOS/Android and during web static rendering.
if (process.env.NODE_ENV === 'development' && typeof document !== 'undefined') {
  require('react-devtools-cdt-mcp/register');
}

require('expo-router/entry');
