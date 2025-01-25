
# 支持小程序调用rpc，使用wx.request


1. 加入依赖

```json
{
    "dependencies": {
        "krpc-mini":"~1.0.0"
    }
}
```

2. 进入小程序目录构建
 
```bash
cd $miniprogram
yarn install
IDE : Tools -> Build npm
``` 

3. 使用 
 
```ts
// pages/index/index.ts
import {RpcResult,ServiceConfig,RpcService} from "krpc-base"
// 云函数版本
// import {CloudRpcClient as  RpcClient} from "krpc-mini"
import {RpcClient} from "krpc-mini"


var name = "hello wx!";
var rpcService : RpcService = RpcClient.create({
    host: "https://idemo.krpc.tech",
    app: "demo-java-server",
    clientId: "m-youruuinon-id",
    //accessToken: "" 可选，需要登录的接口
})

rpcService.async("Demo/hello",{"name":name,"age":123})
    .then(res => {
        console.log(res)
    })

```

## 变更记录

### 1.0.1

* 增加`ServiceConfig`.`tokenProvider`闭包，动态header处理，每次发请求会调用这个方法


## tips

### 小程序不支持二进制请求

本质利用base64对protobuf信息进行文本化。wx.request要求字符串数据传输。

```bash 
# 也可利用curl直接模拟grpc-web-text传输
curl 'https://example.krpc.tech/demo-java-server/M/h' \
    -H 'accept: application/grpc-web-text' \
    -H 'c-id: m-youruuinon-id' \
    -H 'content-type: application/grpc-web-text' \
    --data-binary 'AAAAAAISAA=='
```

https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html#data-%E5%8F%82%E6%95%B0%E8%AF%B4%E6%98%8E

```js
wx.request({
  url: 'https://course.krpc.tech/course/M/v', 
  method:'POST',
  responseType:'arraybuffer',
  enableHttp2:true,
  data: [0,0,0,0,2,0x12,0x00],
  header: {
    'content-type': 'application/grpc-web+proto',
    'x-grpc-web':'1'
  },
  success (res) {
    console.log(res.data)
  }
})
// 503 会强制json序列化, grpc-status: 14
//grpc-message: upstream connect error or disconnect/reset before headers. reset reason: remote reset

//只支持文本请求
wx.request({
  url: 'https://course.krpc.tech/course/M/v', 
  method:'POST',
  enableHttp2:true,
  data: 'AAAAAAISAA==',
  timeout: 150,
  header: {
    'content-type': 'application/grpc-web-text',
    'x-grpc-web':'1'
  },
  success (res) {
    console.log(res.data)
  }
})
```

### 发布小程序

https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html

```bash
cd miniprogram
tsc

miniprogram-ci upload   --pp .  --pkp $PKP --appid $APPID \
  --uv 1.0.0.dev \
  -r 1 \
  --enable-es6 true \
  --enable-minify true \
  --enable-autoprefixwxss true


miniprogram-ci pack-npm --pp .  --pkp $PKP --appid $APPID 


#preview
miniprogram-ci  preview  --pp .  --pkp $PKP --appid $APPID \
  --uv 1.0.0.pre -r 1 \
  --enable-es6 true
```
