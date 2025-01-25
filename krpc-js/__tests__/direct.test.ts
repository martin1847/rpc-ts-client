

import { RpcClient } from '../src/index';
// const { JSDOM } = require("jsdom");
import { describe, test,expect,it,jest } from 'bun:test';//@jest/globals';

import { RpcError,GrpcStatusCode } from 'krpc-base';
import {DemoService} from '../example/demo-service';
import {APP,TimeReq} from '../example/demo-java-server-dto';


// global.fetch = require('jest-mock-fetch');
// globalThis.fetch = require('jest-mock-fetch');

// console.log("(typeof fetch === 'function')")
// console.log(typeof fetch)

const cId = "tsrpc-1234xxxxx";
const demoApp = RpcClient.create({
    // host:'https://idemo.wangyuedaojia.com:4430', 
    host:'https://idemo.wangyuedaojia.com', 
    app:APP,
    withCredentials:true,
     // use https://github.com/fingerprintjs/fingerprintjs
    headers:{"c-id":cId }
});


const demoService = new DemoService(demoApp);

var nameTooLong = "name toooooooooooooooo  long";
nameTooLong+=nameTooLong;
nameTooLong+=nameTooLong;
nameTooLong+=nameTooLong;
nameTooLong+=nameTooLong;
nameTooLong+=nameTooLong;
nameTooLong+=nameTooLong;
nameTooLong+=nameTooLong;
nameTooLong+=nameTooLong;


it('[ test long parse  ] Promise | hello: nameTooLong'  , () => {
    return demoService.str(nameTooLong).then(res=>{
        // console.log(res)
        expect(res.data).toContain(nameTooLong);
        // done()
    });
});

it('[ test Not Exists : helloFake'  , () => {
    return demoService.helloFake().catch((e:RpcError)=>{
        expect(e.code).toBe(GrpcStatusCode.UNIMPLEMENTED);
    });
});


it('[ param too long INVALID_ARGUMENT'  , () => {
    var req = {name:nameTooLong,age:10};
    return demoService.hello(req as any).catch((e:RpcError)=>{
        expect(e.code).toBe(GrpcStatusCode.INVALID_ARGUMENT);
        console.log(e.message.replace(nameTooLong,'...'))
    });
});

const demoAppTimeOut = RpcClient.create({
    host:'https://example.wangyuefake.com', 
    app:APP,
    withCredentials:true,
     // use https://github.com/fingerprintjs/fingerprintjs
    headers:{"c-id":cId },
    timeoutMill:5
});
// RpcClient.debug = 1;
const demoServiceTimeOut = new DemoService(demoAppTimeOut);
it('should time out'  , () => {
    var req = {name:"1234",age:10};
    return demoServiceTimeOut.hello(req as any)
    .then(d=>console.log(d))
    .catch((e:RpcError)=>{
        expect(e.code).toBe(GrpcStatusCode.DEADLINE_EXCEEDED);
        console.log(e.message)
    });
});

it('wait a 2s', async () => {
    const foo = true;
    await new Promise((r) => setTimeout(r, 2000));
    expect(foo).toBeDefined();
    console.log("wait a 2s")
});

