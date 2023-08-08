// / <reference path="../node_modules/miniprogram-api-typings/index.d.ts" />
// import 'miniprogram-api-typings';
export interface SuccResp {
  cookies: string[];
  data?: string;
  errMsg: string;
  header: WechatMiniprogram.IAnyObject;
  statusCode: number; //200
}

export function fetch(
  url: string,
  header: WechatMiniprogram.IAnyObject,
  body: string,
  onSuccess: (resp: SuccResp) => void,
  onFail: (err: WechatMiniprogram.Err) => void,
  timeoutMill?: number,
  method: "OPTIONS" | "GET" | "HEAD" | "POST" = "POST"
): void {
  wx.request({
    url: url,
    data: body,
    method: method,
    header: header,
    enableHttp2: true,
    timeout: timeoutMill,
    //成功时执行
    success(res: WechatMiniprogram.IAnyObject) {
      onSuccess(res as SuccResp);
    },
    //失败时执行
    fail(err: WechatMiniprogram.Err) {
      onFail(err);
    },
  });
  //.onHeadersReceived(resHeaderCallback);
}
