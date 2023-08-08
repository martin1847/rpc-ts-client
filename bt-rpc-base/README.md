
# changes 


几种不同实现，通用接口.
目前支持以下三种实现：
* rpc-web  : grpc-web
* rpc-node : grpc-js/node,pure grpc
* rpc-mini : wx.request + web-text

## 1.0.0 2022-11-21

# 构建方法

```bash
npm config set scripts-prepend-node-path true
npm i -g pnpm 

pnpm config set registry  https://registry.npmmirror.com/
pnpm get registry
pnpm install 
pnpm build
pnpm test

npm config set registry=https://registry.npmjs.org
npm login
npm publish
```




