
# krpc-node

## 1.0.0 2025-01-25

* 依赖标准[`grpc-js`](https://www.npmjs.com/package/@grpc/grpc-js)实现

```ts
// 修改一行代码
import {RpcClient} from "krpc-node"
// pages/index/index.ts
import {RpcResult,ServiceConfig,RpcService} from "krpc-base"

var name = "hello wx!";
var rpcService : RpcService = RpcClient.create({
    host: "https://idemo.krpc.tech",
    app: "demo-java-server",
    clientId: "m-your-uuid",
    //accessToken: "" 可选，需要登录的接口
})

rpcService.async("Demo/hello",{"name":name,"age":123})
    .then(res => {
        console.log(res)
    })
```

