
# changes 


## 1.0.0 2022-11-22

* 依赖标准`grpc-web`实现
* 不支持设置`accessToken`,默认走`cookie`方式

使用方法参考： 
https://gitlab.botaoyx.com/middleware/btyx-rpc-ts-client/-/tree/master/rpc-mini

```ts
// 修改一行代码
import {RpcClient} from "@btyx/rpc-web"

```

# 构建方法

```bash
npm config set scripts-prepend-node-path true
npm i -g pnpm 

pnpm install 
pnpm build

pnpm test
```


