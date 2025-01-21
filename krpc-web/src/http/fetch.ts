// @ ts-nocheck

import { Meta } from 'krpc-base';
import { Transport, TransportFactory, TransportOptions } from './transport';
let debug = console.debug;

// type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
// export type FetchTransportInit = Omit<RequestInit, 'headers' | 'method' | 'body' | 'signal'>;

function fromFetchHeaders(hd: Headers): Meta {
  var mt: Meta = {};
  hd.forEach((v, k) => (mt[k] = v));
  return mt;
}

export function FetchReadableStreamTransport(): TransportFactory {
  return (opts: TransportOptions) => new Fetch(opts);
}

// const isReadableStream = (s: any): s is ReadableStream<Uint8Array> => {
//   return typeof s.getReader == 'function';
// };

// declare const Response: any;
// declare const Headers: any;

class Fetch implements Transport {
  cancelled: boolean = false;
  options: TransportOptions;
  credentials: RequestCredentials;
  // reader?: ReadableStreamDefaultReader<Uint8Array>;
  controller: AbortController = (self as any).AbortController && new AbortController();

  //credentials: ,
  constructor(opts: TransportOptions) {
    this.options = opts;
    this.credentials = opts.withCredentials ? 'include' : 'same-origin';
  }

  // pump(body: ReadableStream<Uint8Array>, res: Response) {
  //   this.reader = body.getReader();
  //   // allows to read streams from the 'node-fetch' polyfill which uses
  //   // node.js ReadableStream instead of the what-wg streams api ReadableStream
  //   // if (isReadableStream(body)) {
  //   //   let whatWgReadableStream = stream.getReader();
  //   //   streamReader = {
  //   //       next: () => whatWgReadableStream.read()
  //   //   };
  //   // } else {
  //   //     streamReader = stream[Symbol.asyncIterator]();
  //   // }

  //   if (this.cancelled) {
  //     // If the request was cancelled before the first pump then cancel it here
  //     this.options.debug && debug('Fetch.pump.cancel at first pump');
  //     this.reader.cancel().catch((e) => {
  //       // This can be ignored. It will likely throw an exception due to the request being aborted
  //       this.options.debug && debug('Fetch.pump.reader.cancel exception', e);
  //     });
  //     return;
  //   }
  //   this.reader
  //     .read()
  //     .then((result) => {
  //       // (result: { done: boolean; value: Uint8Array }) => {

  //       if (result.done) {
  //         console.log("got trunk :" + result.value.length +" , "+ result.value.subarray(0,5))

  //         this.options.onEnd();
  //         return result;
  //       }
  //       this.options.onChunk(result.value as Uint8Array);
  //       this.pump(this.reader!, res);
  //       return;
  //     })
  //     .catch((err) => {
  //       if (this.cancelled) {
  //         this.options.debug && debug('Fetch.catch - request cancelled');
  //         return;
  //       }
  //       this.cancelled = true;
  //       this.options.debug && debug('Fetch.catch', err.message);
  //       this.options.onEnd(err);
  //     });
  // }
  sendMessage(msgBytes: Uint8Array, metadata: Meta) {
    var headers = new Headers();
    Object.keys(metadata).forEach((k) => headers.set(k, metadata[k]));

    fetch(this.options.url, {
      //...this.init,
      credentials: this.credentials,
      headers: headers,
      method: 'POST',
      body: msgBytes,
      signal: this.controller && this.controller.signal,
    })
      .then((res: Response) => {
        this.options.debug && debug('Fetch.response', res);

        this.options.onHeaders(fromFetchHeaders(res.headers), res.status);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }
        // return res.arrayBuffer();
        if (this.cancelled) {
          res.body?.cancel();
        } else {
          return res
            .arrayBuffer()
            .then(this.options.onChunk)
            .then(() => this.options.onEnd());
        }
      })
      // .then(this.options.onChunk)
      // .then(() => this.options.onEnd())
      .catch((err) => {
        // if (this.cancelled) {
        //   // this.options.debug && debug('Fetch.catch - request cancelled');
        //   this.options.onEnd(err);
        //   return;
        // }
        // this.cancelled = true;
        this.options.debug && debug('Fetch.catch', err.message);
        this.options.onEnd(err);
      });
  }

  // finishSend() {}

  // start() {

  // }

  cancel() {
    if (!this.cancelled) {
      this.cancelled = true;
      this.controller?.abort();
      this.options.debug && debug('Fetch.cancel controller abort');
    }

    // if (this.reader) {
    //   // If the reader has already been received in the pump then it can be cancelled immediately
    //   this.options.debug && debug('Fetch.cancel.reader.cancel');
    //   this.reader.cancel().catch((e) => {
    //     // This can be ignored. It will likely throw an exception due to the request being aborted
    //     this.options.debug && debug('Fetch.cancel.reader.cancel exception', e);
    //   });
    // } else {
    //   this.options.debug && debug('Fetch.cancel before reader');
    // }
  }
}
