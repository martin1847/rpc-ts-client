
# KRPC-WEB-Client

## 1.0.0

* 标准`grpc-web`实现,优先`fetch`

```ts
import {RpcClient} from "krpc-web"

// 切换传输，全局优先执行
setDefaultTransportFactory(XhrTransport())
```