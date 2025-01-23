import { FetchReadableStreamTransport } from './fetch';
import { XhrTransport } from './xhr';
import { Meta } from 'krpc-base';

export interface Transport {
  sendMessage(msgBytes: Uint8Array, metadata: Meta): void;
  // finishSend(): void;
  cancel(): void;
  // start(): void;
}

let defaultTransportFactory: TransportFactory = fetchFirstFactory();

export function setDefaultTransportFactory(t: TransportFactory): void {
  defaultTransportFactory = t;
}

export function makeDefaultTransport(options: TransportOptions): Transport {
  return defaultTransportFactory(options);
}

export interface TransportOptions {
  // methodDefinition: MethodDefinition<any, any>;
  debug: boolean;
  url: string;
  withCredentials: boolean;
  onHeaders: (headers: Meta, status: number) => void;
  onChunk: (fullBody: ArrayBuffer) => void;
  onEnd: (err?: Error) => void;
}

export interface TransportFactory {
  (options: TransportOptions): Transport;
}

export function fetchFirstFactory(): TransportFactory {
  if (detectFetchSupport()) {
    return FetchReadableStreamTransport();
  }
  return XhrTransport();
}

function detectFetchSupport(): boolean {
  var res =
    typeof fetch === 'function' && typeof Response !== 'undefined' && Response.prototype.hasOwnProperty('arrayBuffer');
  // console.info('[[[ fetch ]]] support => ' + res);
  // var r2 =  && typeof Headers === 'function';
  // console.log("fetch support => " + r2)
  return res;
  // return typeof Response !== 'undefined' && Response.prototype.hasOwnProperty('body') && typeof Headers === 'function';
}

export function http1ResToMeta(str: string): Meta {
  var res: Meta = {};
  const pairs = str.split('\r\n');
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    const index = p.indexOf(':');
    if (index > 0) {
      const key = p.substring(0, index).trim();
      const value = p.substring(index + 1).trim();
      res[key] = value;
    }
  }
  return res;
}
