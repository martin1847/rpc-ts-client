import { frameRequest, GrpcStatusCode as Code, Meta, parseBodyFrame, parseStatus } from 'bt-rpc-base'; //, httpStatusToCode
let debug = console.debug;
import { Transport, http1ResToMeta, makeDefaultTransport, TransportOptions } from './http/transport';

export interface ProtoRequest {
  serializeBinary(): Uint8Array;
}
export interface Client {
  start(metadata?: Meta): void;
  send(message: ProtoRequest): void;
  finishSend(): void;
  close(): void;

  onHeaders(callback: (headers: Meta) => void): void;
  onMessage(callback: (message: Uint8Array) => void): void;
  onEnd(callback: (code: Code, message: string, trailers: Meta) => void): void;
}

export class GrpcClient {
  // started: boolean = false;
  // sentFirstMessage: boolean = false;
  // completed: boolean = false;
  closed: boolean = false;
  // finishedSending: boolean = false;

  onHeaders_?: (headers: Meta) => void;
  onMessage_?: (res: Uint8Array) => void;
  onEnd_?: (code: Code, message: string, trailers?: Meta) => void;

  transport: Transport;
  debug_: boolean;

  responseHeaders?: Meta;
  responseTrailers?: Meta;

  constructor(
    fullUrl: string,
    onHeaders?: (headers: Meta) => void,
    onMessage?: (res: Uint8Array) => void,
    onEnd?: (code: Code, message: string, trailers?: Meta) => void,
    withCredentials?: boolean,
    debug?: number,
  ) {
    this.debug_ = debug ? true : false;
    this.onEnd_ = onEnd;
    this.onMessage_ = onMessage;
    this.onHeaders_ = onHeaders;

    //const url = `${this.props.host}/${this.methodDefinition.service.serviceName}/${this.methodDefinition.methodName}`;
    const transportOptions: TransportOptions = {
      debug: this.debug_,
      url: fullUrl,
      withCredentials: withCredentials || false,
      onHeaders: this.onTransportHeaders.bind(this),
      onChunk: this.onTransportChunk.bind(this),
      onEnd: this.onTransportEnd.bind(this),
    };

    this.transport = makeDefaultTransport(transportOptions);
  }

  onTransportHeaders(headers: Meta, status: number) {
    this.debug_ && debug('onHeaders', headers, status);
    // The request has failed due to connectivity issues. Do not capture the headers
    if (!this.closed && status !== 0) {
      this.responseHeaders = headers;
      const [gRPCStatus, msg] = parseStatus(headers);
      // this.debug_ && debug('onHeaders.gRPCStatus', gRPCStatus, msg);
      this.rawOnHeaders(headers);
      if (gRPCStatus) {
        //code !== Code.OK
        // server side exception, with http 200 and grpc-status > 0. so we OnError
        this.rawOnError(gRPCStatus, msg!, headers);
      }
    }
  }

  onTransportChunk(fullBody: ArrayBuffer) {
    if (this.closed || !fullBody) {
      this.debug_ && debug('onChunk.close or null body , ignore');
      return;
    }

    let [data, trailer] = parseBodyFrame(new Uint8Array(fullBody));
    this.rawOnMessage(data);
    if (trailer) {
      // console.log('found body with tailers -> ' + trailer);
      this.responseTrailers = http1ResToMeta(trailer);
      this.debug_ && debug('onChunk.trailers', this.responseTrailers);
    }
  }

  onTransportEnd(err?: Error) {
    if (this.closed) {
      this.rawOnError(Code.DEADLINE_EXCEEDED, 'request closed');
      return;
    }
    this.closed = true;
    //merge not need , status code in Trailer if ok, otherwise in headers
    var resHeaders = this.responseTrailers || this.responseHeaders;
    if (!resHeaders || err) {
      this.rawOnError(Code.UNKNOWN, 'Response ended without headers,' + err?.message);
      return;
    }
    this.debug_ && debug('grpc.onEndWithHeaders: ', resHeaders);
    const [gRPCStatus, msg] = parseStatus(resHeaders!);
    if (gRPCStatus === undefined) {
      this.rawOnError(Code.INTERNAL, 'Response closed without grpc-status (Trailers provided)');
      return;
    }
    if (!this.onEnd_) return;
    this.onEnd_(gRPCStatus, msg!, resHeaders);
  }

  rawOnHeaders(headers: Meta) {
    this.debug_ && debug('rawOnHeaders', headers);
    if (this.onHeaders_) this.onHeaders_(headers);
  }

  rawOnError(code: Code, msg: string, trailers?: Meta) {
    this.debug_ && debug('rawOnError', code, msg);
    if (this.onEnd_) this.onEnd_(code, msg, trailers);
  }

  rawOnMessage(res: Uint8Array) {
    this.debug_ && debug('rawOnMessage with len :', res.length);
    if (this.onMessage_) this.onMessage_(res);
  }

  // onHeaders(callback: (headers: Metadata) => void) {
  //   this.onHeadersCallbacks.push(callback);
  // }

  // onMessage(callback: (res: TResponse) => void) {
  //   this.onMessageCallbacks.push(callback);
  // }

  // onEnd(callback: (code: Code, message: string, trailers: Metadata) => void) {
  //   this.onEndCallbacks.push(callback);
  // }

  // start() {
  //   if (this.started) {
  //     throw new Error('Client already started - cannot .start()');
  //   }
  //   this.started = true;

  // }

  // shuld only call once.
  send(msg: ProtoRequest, header?: Meta) {
    // if (this.sentFirstMessage) {
    //   throw new Error('Client already finished sending - cannot .send()');
    // }
    // if (this.closed) {
    //   throw new Error('Client already closed - cannot .send()');
    // }
    header = header || {};
    header['content-type'] = 'application/grpc-web+proto';
    header['x-grpc-web'] = '1'; // Required for CORS handling

    // this.transport.start(requestHeaders);

    // if (!this.methodDefinition.requestStream && !this.sentFirstMessage) {
    //   // This is a unary method and the first and only message has been sent
    //   throw new Error('Message already sent for non-client-streaming method - cannot .send()');
    // }
    // this.sentFirstMessage = true;
    this.transport.sendMessage(frameRequest(msg.serializeBinary()), header);
  }

  // finishSend() {
  //   if (!this.started) {
  //     throw new Error('Client not started - .finishSend() must be called before .close()');
  //   }
  //   if (this.closed) {
  //     throw new Error('Client already closed - cannot .send()');
  //   }
  //   if (this.finishedSending) {
  //     throw new Error('Client already finished sending - cannot .finishSend()');
  //   }
  //   this.finishedSending = true;
  //   this.transport.finishSend();
  // }

  close() {
    if (!this.closed) {
      this.closed = true;
      this.debug_ && debug('request.abort aborting request');
      this.transport.cancel();
    } else {
      this.debug_ && debug('request.abort ignored, beacause the request already closed.');
    }
  }
}
