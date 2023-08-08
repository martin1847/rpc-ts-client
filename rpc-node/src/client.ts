import { validateSync } from 'class-validator';

import { Client, ChannelCredentials, Metadata, CallOptions, ClientOptions } from '@grpc/grpc-js';
import { createSecureContext } from 'tls';

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
} from '@btyx/rpc-base';

// const isDebug = false;
function deserialize_OutputProto(buf: Buffer) {
  return OutputProto.deserializeBinary(new Uint8Array(buf));
}
function serialize_InputProto(arg: InputProto) {
  return Buffer.from(arg.serializeBinary());
}

class NodeClient implements RpcService {
  pathPrefix_: string;
  headers_: Meta;
  exceptionHandler_?: ExceptionHandler;
  timeoutMill_?: number;
  client_: Client; // {(message?: any, ...optionalParams: any[]) : void};

  constructor(client: Client, appPath: string, headers: Meta, exceptionHandler?: ExceptionHandler, timeoutMill?: number) {
    this.client_ = client;
    this.pathPrefix_ = appPath;
    this.headers_ = headers;
    this.exceptionHandler_ = exceptionHandler;
    this.timeoutMill_ = timeoutMill;
  }

  // updateToken(accessToken: string): void {
  //   setToken(this.headers_, accessToken);
  // }

  async<DTO>(method: string, param?: any, cfg?: MethodConfig): Promise<RpcResult<DTO>> {
    const input = new InputProto();
    // let pjson:string="";
    const eh = cfg?.exceptionHandler || this.exceptionHandler_;
    if (param !== undefined && param !== null) {
      const errors = validateSync(param, { validationError: { target: false } });
      if (errors.length > 0) {
        return Promise.reject(new RpcError(RpcError.CLIENT_INVALID_ARGUMENT, JSON.stringify(errors))).catch(eh) as any;
      }
      // pjson= ;
      input.setUtf8(JSON.stringify(param));
    }

    // if(debug){
    //   console.log(`rpcurl https://example.testbtyxapi.com${this.pathPrefix_ + method} -d '${pjson}'`)
    // }
    // const deadline = new Date();
    // deadline.setSeconds(deadline.getSeconds() + 20);
    const options: CallOptions = {};
    if (this.timeoutMill_) {
      const deadline = new Date();
      deadline.setMilliseconds(deadline.getMilliseconds() + this.timeoutMill_);
      options.deadline = deadline;
    }
    let hd = this.headers_;
    if (cfg?.headers) {
      hd = mergeHeader(cfg.headers, this.headers_);
    }
    return new Promise((resolve, reject) => {
      this.client_.makeUnaryRequest<InputProto, OutputProto>(
        this.pathPrefix_ + method,
        serialize_InputProto,
        deserialize_OutputProto,
        input,
        Metadata.fromHttp2Headers(hd),
        options,
        (err, response) => {
          if (err) {
            return reject(err);
          }
          resolve(toResult(response!));
        }
      );
    }).catch(eh) as any;
  }
}

//unary cannot be used with server-streaming methods
//unary cannot be used with client-streaming methods
const clientMap: { [key: string]: Client } = {};
// const debug = true
export class RpcClient {
  public static create(c: ServiceConfig, options?: ClientOptions): RpcService {
    let client = clientMap[c.host];
    if (!client) {
      const url = new URL(c.host);
      client = new Client(
        url.host,
        url.protocol == 'https:' ? ChannelCredentials.createFromSecureContext(createSecureContext()) : ChannelCredentials.createInsecure(),
        options
      );
      clientMap[c.host] = client;
    }
    const [_, appPath, headers] = preproc(c);
    return new NodeClient(client, appPath, headers, c.exceptionHandler, c.timeoutMill);
  }
}
