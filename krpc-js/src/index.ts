// export { RpcClient } from './goog-grpc-web';

import { TextEncoder, TextDecoder } from 'util';
globalThis['TextEncoder'] = globalThis['TextEncoder'] || TextEncoder;
globalThis['TextDecoder'] = globalThis['TextDecoder'] || TextDecoder;

import type { ClientOptions } from '@grpc/grpc-js';

import { RpcClient } from './client';
export { RpcClient };
export type { ClientOptions };
export default RpcClient;
