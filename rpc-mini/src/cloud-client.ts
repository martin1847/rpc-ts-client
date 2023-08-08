import {
  ExceptionHandler,
  ServiceConfig,
  RpcService,
  RpcResult,
  RpcError,
  MethodConfig,
} from "@btyx/rpc-base";

interface CallErr {
  errCode: number;
  errMsg: string;
}
// {"errCode":-1,
// "errMsg":"cloud.callFunction:fail Error: errCode: -504002 functions
// execute fail | errMsg: Error: 12 UNIMPLEMENTED: Method not found: auth/M/h2\n    at Object.callErrorFromStatus "

class CloudRpcClient implements RpcService {
  pathPrefix_: string;
  exceptionHandler_?: ExceptionHandler;
  timeoutMill_?: number;
  tokenProvider_: () => string;

  constructor(
    appPath: string,
    tokenProvider?: () => string,
    exceptionHandler?: ExceptionHandler,
    timeoutMill?: number
  ) {
    this.pathPrefix_ = appPath;
    this.exceptionHandler_ = exceptionHandler;
    this.tokenProvider_ = tokenProvider || (() => "");
    this.timeoutMill_ = timeoutMill;
  }
  async<DTO>(
    method: string,
    param?: any,
    cfg?: MethodConfig
  ): Promise<RpcResult<DTO>> {
    // 云函数调用忽略自定义header

    return wx.cloud
      .callFunction({
        // 要调用的云函数名称
        name: "csapi",
        // 传递给云函数的 event 参数
        data: {
          // ApiCall
          path: this.pathPrefix_ + method,
          param: param,
          token: this.tokenProvider_(),
        },
      })
      .then((obj) => obj.result)
      .catch((err: CallErr) => {
        var eh = cfg?.exceptionHandler || this.exceptionHandler_;
        var e = new RpcError(err.errCode, err.errMsg);
        if (eh) {
          eh(e);
        } else {
          throw e;
        }
      }) as any;
  }
}
export class RpcClient {
  public static create(c: ServiceConfig): RpcService {
    // const [httpHost, appPath, headers] = preproc(c);
    var path = c.app;
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    if (!path.endsWith("/")) {
      path += "/";
    }
    return new CloudRpcClient(
      path,
      c.tokenProvider,
      c.exceptionHandler,
      c.timeoutMill
    );
  }
}
