// 云函数入口文件
const cloud = require('wx-server-sdk')
const grpc = require("@grpc/grpc-js");
const tls = require("tls");
const pb_1 = require("./pb");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境


const client = new grpc.Client(
  "course.btyxapi.com",
  grpc.ChannelCredentials.createFromSecureContext(tls.createSecureContext())
);

// 云函数入口函数
// https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/async.html

function serialize_InputProto(arg) {
  return Buffer.from(arg.serializeBinary());
};
function deserialize_OutputProto(buf) {
  return pb_1.OutputProto.deserializeBinary(new Uint8Array(buf));
};

function toResult(outPt) {
  var result = {};
  result.code = outPt.getC();
  result.message = outPt.getM();
  if (outPt.getDataCase() === pb_1.OutputProto.DataCase.UTF8) {
    result.data = JSON.parse(outPt.getUtf8());
  }
  else {
    result.data = outPt.getBs();
  }
  return result;
};


exports.main = async (arg, context) => {

  var input = new pb_1.InputProto();
  var param = arg.param;
  if (param !== undefined && param !== null) {
    input.setUtf8(JSON.stringify(param));
  }
  // 注意 unionId 仅在满足 unionId 获取条件时返回
  let { OPENID, APPID, UNIONID, SOURCE,CLIENTIP} = cloud.getWXContext()
  var meta = new grpc.Metadata();
  
  meta.add("c-id", UNIONID? ("m-" + UNIONID) : ("mo-"+OPENID))
  if(CLIENTIP){
    meta.add("x-forwarded-for",CLIENTIP)
  }
  meta.add("c-meta", JSON.stringify({os:5,ov:SOURCE,oid:OPENID,aid:APPID}))
  var token = arg.token;
  if (token) {
    meta.add("authorization", "Bearer " + token)
  }

  // const log = cloud.logger()
  // log.info({
  //   name: 'call ' + arg.path,
  //   param : param,
  // })

  return new Promise(function (resolve, reject) {
    client.makeUnaryRequest(arg.path, serialize_InputProto, deserialize_OutputProto, input, meta, function (err, response) {
      if (err) {
        return reject(err);
      }
      resolve(toResult(response));
    });
  });
}

// 测试代码
// yarn test
// async function testCall() {
//   console.log('calling');
//   const result = await exports.main({path:"/auth/M/h"}).catch(err=>console.log(err));
//   console.log(result);
// }
// testCall()
// console.log("globalThis === global : " + (globalThis === global));//true
// console.log(global);
// console.log("globalThis.TextEncoder");
// console.log(TextEncoder);
// console.log("globalThis.fetch");
// console.log(fetch);//fetch is not defined


