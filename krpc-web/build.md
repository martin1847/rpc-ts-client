
## 发布

```bash
bun run build

npm config set registry=https://registry.npmjs.org
npm login # martin.cong
npm publish
```

## 设置CROS

```yaml
# istio virtualservice
# .+ 允许任意域名

 Allow Origins:
    Prefix:  https://local
    Regex: .+|https://.*.wangyuedaojia.com|https://.*.zhulinkeji.com   
```

重点是`.+`允许全部。
不然出错

```log
OPTIONS https://idemo.wangyuedaojia.com/demo-java-server/Demo/str 415 (Unsupported Media Type)
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at "https://idemo.wangyuedaojia.com/demo-java-server/Demo/str".
19 | exports.isOk = isOk;
20 | var grpc_status_code_1 = require("./grpc-status-code");
21 | var RpcError = (function (_super) {
22 |     __extends(RpcError, _super);
23 |     function RpcError(code, message) {
24 |         var _this = _super.call(this, message) || this;
                                ^
error: Response ended without headers,{"onloadstart":null,"onprogress":null,"onabort":null,"onerror":null,"onload":null,"ontimeout":null,"onloadend":null,"upload":{"onloadstart":null,"onprogress":null,"onabort":null,"onerror":null,"onload":null,"ontimeout":null,"onloadend":null},"withCredentials":true}
 code: 2,
```