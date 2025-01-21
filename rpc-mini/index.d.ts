import { ServiceConfig, RpcService } from 'krpc-base';

declare class RpcClient {
    static create(c: ServiceConfig): RpcService;
}

export { RpcClient, RpcClient as default };
export {base64decode,base64encode} from "./base64";