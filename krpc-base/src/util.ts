import { OutputProto } from './pb';
import { RpcResult, Meta, ServiceConfig, RpcError, H_C_ID, H_C_META, H_AUTH } from './index';

export function toResult<DTO>(response: OutputProto) {
  const result = {} as RpcResult<DTO>; //(response.getC());
  result.code = response.getC();
  result.message = response.getM();
  if (response.getDataCase() === OutputProto.DataCase.UTF8) {
    // var json = new TextDecoder("utf-8").decode(response.getUtf8());
    result.data = JSON.parse(response.getUtf8());
  } else {
    result.data = response.getBs() as unknown as DTO;
  }
  return result;
}

export function mergeHeader(methodHeaders?: Meta, headers?: Meta): Meta {
  let mh = methodHeaders || {};
  if (headers) {
    Object.keys(headers).forEach((k) => (mh[k] = headers[k]));
  }
  return mh;
}

export function setToken(hd: Meta, accessToken?: string) {
  if (accessToken) {
    hd[H_AUTH] = 'Bearer ' + accessToken;
  } else {
    delete hd[H_AUTH];
  }
}

export function preproc(cfg: ServiceConfig): [string, string, Meta] {
  let { host, app, clientId, clientMeta, headers } = cfg;
  if (!host.startsWith('http')) {
    throw new RpcError(3, 'only http(s):// host support!');
  }
  var hd = headers || {};
  if (clientId) {
    hd[H_C_ID] = clientId;
  }
  if (clientMeta) {
    hd[H_C_META] = JSON.stringify(clientMeta);
  }
  // injectToken(hd, clientId, accessToken);
  var path = app;
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  if (!path.endsWith('/')) {
    path += '/';
  }
  if (host.endsWith('/')) {
    host = host.slice(0, -1);
  }
  return [host, path, hd];
}
