// sockjs-client (transitively installed by @stomp/ng2-stompjs) expects Node's
// `global` at module load time. Provide it for browser-based unit tests only.
(globalThis as { global?: typeof globalThis }).global = globalThis;
