import {
  ExceptionHandler,
  ServiceConfig,
  RpcService,
  RpcError,
  RpcResult,
  preproc,
  GrpcStatusCode,
  MethodConfig,
} from '@btyx/rpc-base';

// const isDebug = false;
type DataOfRpcResult = any;
export interface ApiData {
  [key: string]: DataOfRpcResult;
}

let rpcMap = {} as ApiData;

class OfflineClient implements RpcService {
  pathPrefix_: string;
  exceptionHandler_?: ExceptionHandler;
  constructor(appPath: string, exceptionHandler?: ExceptionHandler) {
    this.pathPrefix_ = appPath;
    this.exceptionHandler_ = exceptionHandler;
  }

  async<DTO>(method: string, param?: any, cfg?: MethodConfig): Promise<RpcResult<DTO>> {
    const key = this.pathPrefix_ + method;
    if (param !== undefined && param !== null) {
      let res = rpcMap[key + JSON.stringify(param)];
      if (res !== undefined && res !== null) {
        return Promise.resolve({ code: 0, data: res } as RpcResult<DTO>);
      }
    }
    let res = rpcMap[key];
    if (res !== undefined && res !== null) {
      return Promise.resolve({ code: 0, data: res } as RpcResult<DTO>);
    }
    const eh = cfg?.exceptionHandler || this.exceptionHandler_;

    return Promise.reject(new RpcError(GrpcStatusCode.NOT_FOUND, key + ': 数据不存在!')).catch(eh) as any;
  }
}

//unary cannot be used with server-streaming methods
//unary cannot be used with client-streaming methods
export class RpcClient {
  public static setData(data: ApiData) {
    rpcMap = data || {};
  }

  public static create(c: ServiceConfig): RpcService {
    const [httpHost, appPath, headers] = preproc(c);
    return new OfflineClient(appPath, c.exceptionHandler);
  }
}
