

/* eslint-disable */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:no-string-literal */

// @ ts-nocheck
import { describe, test,expect,it } from '@jest/globals';

import {RpcResult,PagedQuery,Meta,RpcError} from 'krpc-base';
import { RpcClient } from '../src/index';
// import { RpcClient } from '../src/goog-grpc-web';


import {DemoService} from '../example/demo-service';
import {APP,TimeReq,TimeResult, User,UserStatus} from '../example/demo-java-server-dto';

const cId = "tsrpc-1234xxxxx";
const demoApp = RpcClient.create({
    host:'https://example.testbtyxapi.com', 
    app:APP,
    withCredentials:true,
    clientId : cId
});


const demoService = new DemoService(demoApp);

const request = new TimeReq("hello-node-jest", 18);


var helloKey = 'hello-jest';

//
it('hello ' + helloKey, () => {
    var request = new TimeReq(helloKey, 18);
    return demoService.hello(request).then(res => {

        expect(res.data.time).toContain(helloKey);
        expect(res.data.time).toContain(cId);
        console.log(res)
    });
});


it('str: ' + helloKey, () => {
    return demoService.str(helloKey).then(res => {
        expect(res.data).toContain(helloKey);
    });
});

var name = "TS测试";
var user = new User();
user.id = 123;
user.name = name;
user.stat = UserStatus.VIP;

it('save User: ' , () => {
    return demoService.save(user).then(res => {
        expect(res.data).toContain(name);
    });
});


it('wordLength: ' , () => {
    return demoService.wordLength(["hello","jest"]).then(res => {
        // expect(res.data).toContain(helloKey);
        console.log(JSON.stringify(res.data))
    });
});

////------------- 测Map & bytes/Uint8Array-----

it('bytesTime: ' , () => {
    return demoService.bytesTime().then(res => {
        // expect(res.data).toContain(helloKey);
        console.log(JSON.stringify(res.data))
    });
});

it('testMap: ' , () => {
    return demoService.testMap().then(res => {
        // expect(res.data).toContain(helloKey);
        console.log(JSON.stringify(res))
    });
});



////------------- 测范型 -----


it('plistUser: ' , () => {
    var req = new PagedQuery<User>(10);
    req.q = user;
    req.page = 1;
    return demoService.plistUser(req).then(res => {
        console.log(JSON.stringify(res.data))
        expect(res.data.data[0]!.name).toBe(user.name );
        
    });
});

it('listUser: ' , () => {
    return demoService.listUser([user]).then(res => {
        console.log(JSON.stringify(res.data))
        expect(res.data[0]!.name).toBe(user.name );
    });
});

it('listInt: ' , () => {
    var req = new PagedQuery<number>(10);
    req.q = 100;
    req.page = 1;
    return demoService.listInt(req).then(res => {
        console.log(JSON.stringify(res.data))
        // expect(res.data).toBe(user.name );
    });
});


//////-------------- 测异常-----------
var name = "name"
it('[ exception client ] Promise | hello: age too big'  , () => {
    return demoService.hello(new TimeReq(name, 1000)).catch(e=>{
        console.log("dump error in catch promise: " +  JSON.stringify(e));
        expect(e.code).toBe(RpcError.CLIENT_INVALID_ARGUMENT);
    });
});

it('[ exception Server ] Promise | testRuntimeException: ' , () => {
    return demoService.testRuntimeException().catch(e=>{//grpcWeb.RpcError
        console.log("dump error in catch promise: " +  JSON.stringify(e));
       // expect(e.code).toBe(2);//,"grpc-status":"2"
        expect(e.code).toBe(2);//grpcWeb.StatusCode.UNKNOWN)
        expect(e.message).toContain("RuntimeException");
    });
});