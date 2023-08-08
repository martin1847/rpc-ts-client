import { GrpcStatusCode } from './grpc-status-code';

export class RpcError extends Error {
  static readonly CLIENT_INVALID_ARGUMENT = 400;
  // 腾讯云函数代理服务器统一返回
  static readonly PROXY_ERROR = -1;

  code: GrpcStatusCode;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    // Object.setPrototypeOf(this, new.target.prototype);
  }
}

//  const SUCCESS = 0;
// export type RpcResult2<DTO> = {
//   code: number;
//   data: DTO;
// } | {
//   /**
//    * super set of  grpc.StatusCode.OK
//    * https://grpc.github.io/grpc/core/md_doc_statuscodes.html
//    */
//   code: number;
//     /**
//    * message/data 互斥，code == 0/GrpcStatusCode.OK 时有data
//    */
//   message: string;
// };

export interface RpcResult<DTO> {
  code: number;
  /**
   * message/data 互斥，code == 0/GrpcStatusCode.OK 时有data
   */
  message?: string;
  data: DTO;
}

export interface PagedList<DTO> {
  count: number;

  data: Array<DTO>;
  /**
   * 下拉分页用，有这个不返回count
   */
  lastKey?: string;
}

export class PagedQuery<Query> {
  /**
   * 从1开始
   */
  page: number;

  /**
   * 1 - 100
   */
  pageSize: number;

  q?: Query;

  constructor(pageSize: number, page: number = 1) {
    this.pageSize = pageSize;
    this.page = page;
  }
}

export function isOk<DTO>(res: RpcResult<DTO>): boolean {
  return res.code === GrpcStatusCode.OK;
}

export interface ExceptionHandler {
  (e: RpcError): void;
}

export interface Meta {
  [s: string]: string;
}

// /**
//  * 跟fetch对象重名了，避免使用
//  * @deprecated
//  */
// export type Headers = Meta;

export type R<T> = Promise<RpcResult<T>>;

export const H_C_ID = 'c-id';
export const H_AUTH = 'authorization';
export const H_C_META = 'c-meta';

export interface MethodConfig {
  /**
   * headers；method（优先，会覆盖service级别的）/service级别可以设置不变的
   */
  headers?: Meta;
  /**
   * method（优先）/service级别异常处理
   */
  exceptionHandler?: ExceptionHandler;
}

export interface ServiceConfig extends MethodConfig {
  /**
   * http(s)://xxapi.com
   */
  host: string;
  /**
   * 所属app名字，比如: `auth`，`course`
   */
  app: string;
  /**
   * 仅rpc-web需要，登录后接口允许发送cookie
   */
  withCredentials?: boolean;
  /**
   * 小程序用到，认证身份接口
   */
  tokenProvider?: () => string;
  /**
   * 相当于header里设置 `c-id`
   */
  clientId?: string;
  /**
   * 相当于header里设置 `c-meta`;其余通用meta参数，封装为json格式;
   * https://redmine.botaoyx.com/projects/bt/wiki/%E5%85%A8%E5%B1%80header
   */
  clientMeta?: { [key: string]: string | number };
  /**
   * 超时时间，部分客户端支持，毫秒
   */
  timeoutMill?: number;
}

export interface RpcService {
  async<DTO>(method: string, param?: any, cfg?: MethodConfig): R<DTO>;
}
