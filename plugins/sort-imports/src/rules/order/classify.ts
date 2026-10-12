import type { ImportNode, Kind } from './types.ts';

const BUILTINS = new Set([
    'assert',
    'async_hooks',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'constants',
    'crypto',
    'dgram',
    'diagnostics_channel',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'http2',
    'https',
    'inspector',
    'module',
    'net',
    'os',
    'path',
    'perf_hooks',
    'process',
    'punycode',
    'querystring',
    'readline',
    'repl',
    'stream',
    'string_decoder',
    'sys',
    'timers',
    'tls',
    'trace_events',
    'tty',
    'url',
    'util',
    'v8',
    'vm',
    'wasi',
    'worker_threads',
    'zlib'
]);

export function classify(node: ImportNode, internalPattern: string[]): Kind {
    if (node.importKind === 'type') return 'type';
    const src = node.source.value;
    if (src === '.' || src === './') return 'index';
    if (src.startsWith('../')) return 'parent';
    if (src.startsWith('./')) return 'sibling';
    if (internalPattern.some((p) => src.startsWith(p))) return 'internal';
    if (src.startsWith('node:')) return 'builtin';
    if (BUILTINS.has(src.split('/')[0])) return 'builtin';
    return 'external';
}
