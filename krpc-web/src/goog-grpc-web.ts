/**
 * @fileoverview RPC client for BestULearn
 * @enhanceable
 * @public
 */

/* eslint-disable */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:no-string-literal */
// @ ts-nocheck

// https://github.com/grpc/grpc-web/tree/1.3.0/javascript/net/grpc/web
import {
  AbstractClientBase,
  GrpcWebClientBase,
  //Metadata,
  MethodDescriptor,
  MethodType,
  GrpcWebClientBaseOptions,
} from 'grpc-web';

//https://github.com/typestack/class-validator
import { validateSync } from 'class-validator';

import {
  InputProto,
  OutputProto,
  ExceptionHandler,
  ServiceConfig,
  RpcService,
  RpcError,
  RpcResult,
  mergeHeader,
  toResult,
  preproc,
  Meta,
  MethodConfig,
} from 'krpc-base';

const MINFO = new MethodDescriptor(
  '',
  MethodType.UNARY,
  undefined as any,
  undefined as any,
  InputProto.serializeBinary,
  OutputProto.deserializeBinary,
);

class RpcWeb implements RpcService {
  // static globalExceptionHandler: ExceptionHandler = (e) => {
  //   throw e;
  // };

  // private static EMPTY_ACTION: HeadersHandler = (h) => {};

  client_: AbstractClientBase;

  pathPrefix_: string;
  headers_: Meta;
  exceptionHandler_?: ExceptionHandler;
  timeoutMill_?: number;

  constructor(
    httpHost: string,
    appPath: string,
    headers: Meta,
    options: GrpcWebClientBaseOptions,
    exceptionHandler?: ExceptionHandler,
    timeoutMill?: number,
  ) {
    this.pathPrefix_ = httpHost + appPath;
    this.headers_ = headers;
    this.exceptionHandler_ = exceptionHandler;
    this.timeoutMill_ = timeoutMill;

    //const XhrIo = goog.require('goog.net.XhrIo');
    //https://developers.google.com/closure/library/docs/xhrio
    //https://github.com/grpc/grpc-web/blob/master/javascript/net/grpc/web/grpcwebclientbase.js#L183
    /**
     * 
     *     const xhr = this.xhrIo_ ? this.xhrIo_ : new XhrIo();
            xhr.setWithCredentials(this.withCredentials_);

            const genericTransportInterface = {
              xhr: xhr,
            };
            const stream = new GrpcWebClientReadableStream(genericTransportInterface);
     * 
     */
    this.client_ = new GrpcWebClientBase(options);
  }

  // resetToken(clientId: string, accessToken?: string): void {
  //   injectToken(this.headers_, clientId);
  // }

  async<DTO>(method: string, request?: any, cfg?: MethodConfig): Promise<RpcResult<DTO>> {
    const input = new InputProto();
    const eh = cfg?.exceptionHandler || this.exceptionHandler_;
    if (request !== undefined && request !== null) {
      var errors = validateSync(request, { validationError: { target: false } });
      if (errors.length > 0) {
        return Promise.reject(new RpcError(RpcError.CLIENT_INVALID_ARGUMENT, JSON.stringify(errors))).catch(eh) as any;
      }
      input.setUtf8(JSON.stringify(request));
    }
    return this.client_
      .thenableCall<InputProto, OutputProto>(
        this.pathPrefix_ + method,
        input,
        mergeHeader(cfg?.headers, this.headers_),
        MINFO,
      )
      .then(toResult)
      .catch(eh) as any;
  }
}

export class RpcClient {
  public static create(c: ServiceConfig): RpcService {
    var options = {} as GrpcWebClientBaseOptions;
    if (c.withCredentials) {
      options.withCredentials = true;
    }
    options.format = 'binary';
    const [httpHost, appPath, headers] = preproc(c);
    return new RpcWeb(httpHost, appPath, headers, options, c.exceptionHandler, c.timeoutMill);
  }
}
