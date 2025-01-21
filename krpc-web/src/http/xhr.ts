import { Transport, TransportFactory, TransportOptions, http1ResToMeta } from './transport';
let debug = console.debug;
import { GrpcStatusCode, RpcError, Meta } from 'krpc-base';

export function XhrTransport(): TransportFactory {
  return (opts: TransportOptions) => new XHR(opts);
}

export class XHR implements Transport {
  options: TransportOptions;
  withCredentials: boolean;
  xhr!: XMLHttpRequest;
  index: number = 0;

  constructor(transportOptions: TransportOptions) {
    this.options = transportOptions;
    this.withCredentials = transportOptions.withCredentials;
  }

  // onProgressEvent() {
  //text only
  // this.options.debug && debug('XHR.onProgressEventTrunk.length: ', this.xhr.response.length);
  // const rawText = this.xhr.response.substr(this.index);
  // this.index = this.xhr.response.length;
  // var bytes = stringToArrayBuffer(rawText);
  // if(isDataFrame(bytes[0])){
  //   this.data = bytes.subarray(HEADER_SIZE);
  // }else{
  //   this.trailers = parseTrailer(bytes);
  // }
  // this.data = new Uint8Array(this.xhr.response);
  // this.options.onChunk(asArrayBuffer);
  // }

  // onLoadEvent() {
  //   // console.log("onload :" + this.xhr.response.length)
  //   // this.options.onChunk(this.data!,this.trailers);
  //   // let [data,tailer] = parseGrpcWebFrame(new Uint8Array())
  //   this.options.onChunk(this.xhr.response);
  //   this.options.onEnd();
  // }

  onStateChange() {
    //2 HEADERS_RECEIVED
    //3 LOADING
    //3 LOADING
    //4 DONE
    this.options.debug && debug('XHR.onStateChange', this.xhr.readyState);
    if (this.xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
      this.options.onHeaders(http1ResToMeta(this.xhr.getAllResponseHeaders()), this.xhr.status);
    } else if (this.xhr.readyState === XMLHttpRequest.DONE) {
      this.options.onChunk(this.xhr.response);
      this.options.onEnd();
    }
  }

  sendMessage(msgBytes: Uint8Array, metadata: Meta) {
    const xhr = new XMLHttpRequest();
    this.xhr = xhr;
    xhr.open('POST', this.options.url);

    // this.configureXhr();
    this.xhr.responseType = 'arraybuffer';
    Object.keys(metadata).forEach((k) => {
      xhr.setRequestHeader(k, metadata[k]);
    });

    xhr.withCredentials = this.withCredentials;

    xhr.addEventListener('readystatechange', this.onStateChange.bind(this));
    // xhr.addEventListener('progress', this.onProgressEvent.bind(this));
    // xhr.addEventListener('loadend', this.onLoadEvent.bind(this));
    xhr.addEventListener('error', (err) => {
      this.options.debug && debug('XHR.error', err);
      this.options.onEnd(new Error(JSON.stringify(err.target)));
    });
    xhr.send(msgBytes);
  }

  cancel() {
    this.options.debug && debug('XHR.abort');
    this.xhr.abort();
  }
}
