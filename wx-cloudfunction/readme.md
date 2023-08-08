
微信云函数rpc函数


## 依赖rpc-base/dist/pb.js

```bash
cd csapi
ln -s ../../rpc-base/dist/pb.* .
```


## 调用方式

使用方法参考： 
https://gitlab.botaoyx.com/middleware/btyx-rpc-ts-client/-/tree/master/rpc-mini

```ts
// 云函数版本
import {CloudRpcClient as  RpcClient} from "@btyx/rpc-mini"
```

核心用微信云函数`wx.cloud.callFunction`：做了个封装

```ts

// export interface ApiCall {
//   path: string;// /$app/$service/$method
//   param?: any;
//   token?: string;
// }

wx.cloud.callFunction({
  // 要调用的云函数名称
  name: 'csapi',
  // 传递给云函数的 event 参数
  data: { // ApiCall
    path: '/auth/Oauth/encryptKey',
    param: null,
  }
}).then(res => { // RpcResult
  // output: res.code === 0
}).catch(err => {
  // handle error
})
```

## 测试 yarn test

```ts
// 放开index.js里面的注释
// yarn test
async function testCall() {
  console.log('calling');
  const result = await exports.main({path:"/auth/M/h"}).catch(err=>console.log(err));
  console.log(result);
}
testCall()

```


## 上传方式：
注意，在 IDE 中选择上传云函数时，可以选择云端安装依赖（不上传 node_modules 文件夹）或全量上传（同时上传 node_modules 文件夹）。


## 一些业务流程

### 通过云函数登录zhijisx 

1. 小程序授权获取手机号，拿到`phoneCode`

https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html

会拿到一个`code` 动态令牌，5分钟有效。可通过动态令牌换取用户手机号

2. 通过云函数调用我们的登录接口`ThirdAuthService.wxMiniLogin`

获取用户手机号,自动注册&登录，成功后签发我们的 `token`和`refreshToken`

后续再登录直接`refresh`即可，就像app一样。
注意根据有效期缓存到本地即可。


### 直接登录zhijisx 


比`云函数`多一步操作： 小程序登录微信`wx.login`获取用户信息交换码`jsCode`
然后和`phoneCode`一起扔过来。



