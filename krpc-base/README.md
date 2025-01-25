# changes

几种不同实现，通用接口。目前支持以下三种实现：

* krpc-web  : grpc-web
* krpc-node : grpc-js/node,pure grpc
* krpc-mini : wx.request + web-text

## 1.0.0 2022-11-21

## 构建方法

```bash
npm config set scripts-prepend-node-path true

bun install
bun run build
bun test
# if bun test error , fallback to node/npm
# npm test

npm config set registry=https://registry.npmjs.org
npm login # martin.cong
npm publish
```
