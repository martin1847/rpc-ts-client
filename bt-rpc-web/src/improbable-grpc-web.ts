import { GrpcClient } from './client';
// import { Metadata, Meta } from './metadata';
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
  GrpcStatusCode as Code,
  parseStatus,
  MethodConfig,
} from 'bt-rpc-base';

// const isDebug = false;

class ImprobableRpcWeb implements RpcService {
  withCredentials_?: boolean;

  pathPrefix_: string;
  headers_: Meta;
  exceptionHandler_?: ExceptionHandler;
  timeoutMill_?: number;
  debug_: boolean; // {(message?: any, ...optionalParams: any[]) : void};

  constructor(
    httpHost: string,
    appPath: string,
    headers: Meta,
    withCredentials?: boolean,
    exceptionHandler?: ExceptionHandler,
    timeoutMill?: number,
    debug = 0,
  ) {
    this.pathPrefix_ = httpHost + appPath;
    this.headers_ = headers;
    this.exceptionHandler_ = exceptionHandler;
    this.timeoutMill_ = timeoutMill;
    this.withCredentials_ = withCredentials;
    this.debug_ = debug ? true : false; //debug ? console.debug : (message?: any, ...optionalParams: any[])=>{};
  }

  // resetToken(clientId: string, accessToken?: string): void {
  //   injectToken(this.headers_, clientId);
  // }

  async<DTO>(method: string, param?: any, cfg?: MethodConfig): Promise<RpcResult<DTO>> {
    const input = new InputProto();
    const eh = cfg?.exceptionHandler || this.exceptionHandler_;
    if (param !== undefined && param !== null) {
      var errors = validateSync(param, { validationError: { target: false } });
      if (errors.length > 0) {
        return Promise.reject(new RpcError(RpcError.CLIENT_INVALID_ARGUMENT, JSON.stringify(errors))).catch(eh) as any;
      }
      input.setUtf8(JSON.stringify(param));
    }

    const prom = new Promise<RpcResult<DTO>>((resolve, reject) => {
      const grpcClient = new GrpcClient(
        this.pathPrefix_ + method,
        (hd: Meta) => {
          //服务端异常status会放在header里面
          //console.log('OnHeader Called :' + JSON.stringify(hd));
          let [status, msg] = parseStatus(hd);
          if (status) {
            reject(new RpcError(status, msg!));
          }
        },
        (msgBytes: Uint8Array) => {
          var outp = OutputProto.deserializeBinary(msgBytes);
          resolve(toResult(outp));
        },
        (status: Code, statusMessage: string, resMeta?: Meta) => {
          // console.log("OnEnd" + status)
          // 客户端取消、验证等客户端异常
          if (status) {
            // != GrpcStatusCode.OK
            reject(new RpcError(status, statusMessage));
          }
        },
        this.withCredentials_,
        RpcClient.debug,
      );

      grpcClient.send(input, cfg?.headers ? mergeHeader(cfg?.headers, this.headers_) : this.headers_);
      if (this.timeoutMill_) {
        setTimeout(() => grpcClient.close(), this.timeoutMill_);
      }
    });
    if (eh) {
      prom.catch(eh);
    }
    return prom;
  }
}

//unary cannot be used with server-streaming methods
//unary cannot be used with client-streaming methods
export class RpcClient {
  static debug = 0;

  public static create(c: ServiceConfig): RpcService {
    let withCredentials: boolean = c.withCredentials || false;

    const [httpHost, appPath, headers] = preproc(c);
    return new ImprobableRpcWeb(httpHost, appPath, headers, withCredentials, c.exceptionHandler, c.timeoutMill);
  }
}
