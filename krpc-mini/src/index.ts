// "@protobuf-ts/runtime-rpc";

import { fetch } from "./fetch";

import {
  InputProto,
  OutputProto,
  ExceptionHandler,
  GrpcStatusCode,
  ServiceConfig,
  RpcService,
  RpcError,
  RpcResult,
  Meta,
  frameRequest,
  parseStatus,
  parseBodyFrame,
  preproc,
  mergeHeader,
  toResult,
  setToken,
  MethodConfig,
} from "krpc-base";

import { base64encode, base64decode } from "./base64";

function fillGrpcWebTextHeader(headers: Meta, timeoutMill?: number): Meta {
  headers["content-type"] = "application/grpc-web-text";
  headers["accept"] = "application/grpc-web-text";
  // Required for CORS handling, but wx.request not same like  CORS
  // requestHeaders.set("x-grpc-web", "1");
  // headers["X-Grpc-Web"] = "1";
  if (timeoutMill) {
    // server side may ignore. it's better client side handler it.
    headers["grpc-timeout"] = `${timeoutMill}m`;
  }
  return headers;
}

class GrpcWebTextClient implements RpcService {
  pathPrefix_: string;
  headers_: Meta;
  tokenProvider_: () => string;
  exceptionHandler_?: ExceptionHandler;
  timeoutMill_?: number;

  constructor(
    httpHost: string,
    appPath: string,
    headers: Meta,
    tokenProvider?: () => string,
    exceptionHandler?: ExceptionHandler,
    timeoutMill?: number,
  ) {
    this.pathPrefix_ = httpHost + appPath;
    this.headers_ = headers;
    this.tokenProvider_ = tokenProvider || (() => "");
    this.exceptionHandler_ = exceptionHandler;
    this.timeoutMill_ = timeoutMill;
  }

  // updateToken(accessToken: string): void {
  //   setToken(this.headers_, accessToken);
  // }

  async<DTO>(
    method: string,
    param?: any,
    cfg?: MethodConfig,
  ): Promise<RpcResult<DTO>> {
    let fullUrl = this.pathPrefix_ + method;
    let input = new InputProto();
    if (param !== undefined && param !== null) {
      input.setUtf8(JSON.stringify(param));
    }
    let tms = this.timeoutMill_;
    let hd = mergeHeader(cfg?.headers, this.headers_);
    setToken(hd, this.tokenProvider_());
    let meta = fillGrpcWebTextHeader(hd, tms);
    return new Promise((resolve, reject) => {
      fetch(
        fullUrl,
        meta,
        base64encode(frameRequest(input.serializeBinary())),
        (res) => {
          //text先检查请求header,貌似没有追加tailers grpc-status:0
          //异常请求会直接放到header里
          let [status, msg] = parseStatus(res.header);
          if (status) {
            // != GrpcStatusCode.OK
            reject(new RpcError(status, msg!));
            return;
          }
          let body = res.data;
          //确认有数据
          if (body) {
            let [dataFrame] = parseBodyFrame(base64decode(body));
            //忽略TRAILER
            let out = OutputProto.deserializeBinary(dataFrame);
            resolve(toResult(out));
          } else {
            reject(
              new RpcError(
                GrpcStatusCode.DATA_LOSS,
                "invalid response,no body or grpc-status found!",
              ),
            );
          }
        },
        (err) =>
          reject(
            new RpcError(
              err.errno ||
                (err.errMsg?.endsWith("timeout")
                  ? GrpcStatusCode.DEADLINE_EXCEEDED
                  : GrpcStatusCode.UNKNOWN),
              err.errMsg,
            ),
          ),
        tms,
      );
    }).catch(cfg?.exceptionHandler || this.exceptionHandler_) as any;
  }
}

export class RpcClient {
  public static create(c: ServiceConfig): RpcService {
    const [httpHost, appPath, headers] = preproc(c);
    return new GrpcWebTextClient(
      httpHost,
      appPath,
      headers,
      c.tokenProvider,
      c.exceptionHandler,
      c.timeoutMill,
    );
  }
}

export { RpcClient as CloudRpcClient } from "./cloud-client";

export * from "./base64";
// export * from "./b64js";
// export * from "./b64wasm";
