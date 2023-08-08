

// import * as grpcWeb from 'grpc-web';
import { PagedQuery, GrpcStatusCode } from '../src/index';
import {frameRequest, parseBodyFrame} from '../src/grpc-web-format'
import {InputProto, OutputProto} from '../src/pb'
import {mergeHeader, toResult} from '../src/util'
import { createHash } from 'crypto';
import { describe, test,expect,it } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util'



it("u8encode emoji ",()=>{
    var em1234='1ē三😈'//1234bytes
    var u8 = new TextEncoder().encode(em1234)
    var res = OutputProto.textDecode(u8)
    expect(res).toBe(em1234);
    expect(u8.length).toBe(1+2+3+4)
    expect(u8.toString()).toBe("49,196,147,228,184,137,240,159,152,136");
})



global['TextEncoder'] = global['TextEncoder'] || TextEncoder;
// global['TextDecoder'] = global['TextDecoder'] || TextDecoder;




it('Merge: ', () => {
    var pq = new PagedQuery(10);
    var merge = mergeHeader();
    expect(merge["key"]).toBe(undefined);
    merge = mergeHeader(undefined,{"key": 'one'});
    expect(merge["key"]).toBe('one');
    merge = mergeHeader({"key": 'one'});
    expect(merge["key"]).toBe('one');
    merge = mergeHeader({"key": 'two'},{"key": 'one'});
    expect(merge["key"]).toBe('one');
});

const md5 = (data: string|Uint8Array) => createHash('md5').update(data).digest("hex");

function load1280txt():string{
    let txt = "1234567890一二三四五六七八九十";
    txt += txt;txt += txt;
    txt += txt;txt += txt;
    txt += txt;txt += txt;
    return txt
}

function param2b64(param?:any,b64:boolean=true):string{
    var inp = new InputProto()
    if(param !== undefined && param !== null){
        inp.setUtf8(JSON.stringify(param))
    }
    var bodyFrame = frameRequest(inp.serializeBinary())
    return b64 ? Buffer.from(bodyFrame).toString('base64')
     : OutputProto.textDecode(bodyFrame)
}

it('bigtext Input serializeBinary', () => {
    var txt  = load1280txt()
    expect(md5(txt)).toBe('2285ad41be6622911e7c9a03201e7bcc');
    expect(txt.length).toBe(1280);
    var inp = new InputProto();
    inp.setUtf8(txt);
    var u8arr = inp.serializeBinary();
    expect(u8arr.length).toBe(2563);
    expect(md5(u8arr)).toBe('fe5d39d0dfdbf374dcb3b52940899d3b');
});


it('OutputProto.deserializeBinary', () => {
   
    //{"count":10,"data":[{"id":123,"name":"TS测试","stat":"VIP"}]}
    var arr = new Uint8Array([
        26,  63, 123,  34,  99, 111, 117, 110, 116,  34,  58,  49,
        48,  44,  34, 100,  97, 116,  97,  34,  58,  91, 123,  34,
       105, 100,  34,  58,  49,  50,  51,  44,  34, 110,  97, 109,
       101,  34,  58,  34,  84,  83, 230, 181, 139, 232, 175, 149,
        34,  44,  34, 115, 116,  97, 116,  34,  58,  34,  86,  73,
        80,  34, 125,  93, 125
     ]
    );

    var outp = new OutputProto(arr);
    expect(JSON.stringify(toResult(outp).data))
        .toBe('{"count":10,"data":[{"id":123,"name":"TS测试","stat":"VIP"}]}');

    arr = new Uint8Array([34,  6, 22, 11,23, 13, 41, 12])
    outp = new OutputProto(arr);
    expect((JSON.stringify(toResult(outp))))
        .toBe('{"code":0,"data":{"0":22,"1":11,"2":23,"3":13,"4":41,"5":12}}');
   
    arr = new Uint8Array([ 26,  25,  34, 106,  97, 118,  97,
        53,  54,  55,  56,  58, 103, 111,
       116,  58, 104, 101, 108, 108, 111,
        45, 106, 101, 115, 116,  34])
    outp = new OutputProto(arr);
    // console.log(JSON.stringify(toResult(outp)))
    expect((JSON.stringify(toResult(outp))))
        .toBe('{"code":0,"data":"java5678:got:hello-jest"}');
       
    arr = new Uint8Array([ 26,  5, 91, 53, 44, 52, 93])
    outp = new OutputProto(arr);
    // console.log(JSON.stringify(toResult(outp)))
    expect((JSON.stringify(toResult(outp))))
        .toBe('{"code":0,"data":[5,4]}');
    
});

it('Empty Input shule be AAAAAAISAA== ', () => {
    expect(param2b64()).toBe('AAAAAAISAA==')

    console.log("curl https://example.testbtyxapi.com/demo-java-server/M/h \
    -H 'accept: application/grpc-web-text' \
    -H 'content-type: application/grpc-web-text' \
    -d 'AAAAAAISAA=='")
})

it('full body text frame', () => {
    var b64="AAAAAE4aTCJ2NjEzMi1zMTAzMS0yMDIyLTExLTEwVDE2OjE3LThlMWVjNjc3ICAsIGRlbW8tamF2YS1zZXJ2ZXItNjg3NDc4OWY4NS01NjUycCI=gAAAAA9ncnBjLXN0YXR1czowDQo=";
    var bytes = Buffer.from(b64, 'base64')
    var [data,tailer] = parseBodyFrame(bytes)
    //text with no tailer
    expect(tailer).toBe(undefined)
    // console.log(String.fromCharCode(...Array.prototype.slice.call(tailer)))
    // console.log(new TextDecoder("utf8").decode(tailer))
    var res = toResult(OutputProto.deserializeBinary(data))
    expect(res.code).toBe(GrpcStatusCode.OK)
})

it('full body bin frame shuld has grpc-status:0', () => {
    var bytes = new Uint8Array([
        0,   0,  0,   0,   7,  26,  5,  91,  53,
       44,  52, 93, 128,   0,   0,  0,  15, 103,
      114, 112, 99,  45, 115, 116, 97, 116, 117,
      115,  58, 48,  13,  10
    ]);
    var [data,tailer] = parseBodyFrame(bytes)
    
    var res = toResult(OutputProto.deserializeBinary(data))
    expect(res.code).toBe(GrpcStatusCode.OK)
    // HTTP CRLF truncked header. HTTP/1 headers block (without the terminating newline)
    // https://tools.ietf.org/html/rfc7230#section-3.2
    //https://github.com/grpc/grpc-web/blob/master/src/connector/src/main/java/io/grpcweb/RequestHandler.java#L148
    // onNext => sendResponse.writeResponse(outB);
    // onCompleted => sendResponse.writeStatusTrailer(Status.OK);
    //https://github.com/grpc/grpc-web/blob/master/src/connector/src/main/java/io/grpcweb/SendResponse.java#L74
    // String.format("grpc-status:%d\r\n"
    expect(tailer).toBe('grpc-status:0\r\n')
})

var datas = [1,2,3,"哈哈哈哈","12345"]
datas.forEach(d=>{
    console.log(d)
    console.log(param2b64(d))
    console.log('['+param2b64(d,false)+']')
})

var dd='AAAAAF0aW1t7ImltZ1VybCI6Imh0dHBzOi8vaS56aGlqaXN4LmNvbS9pbWFnZS9kZWZhdWx0LzIxN0JFQUIzQTBFMDRENUFCQzY4MThCOUNGMjJFNjgwLTYtMi5wbmcifV0=gAAAAA9ncnBjLXN0YXR1czowDQo='
console.log(new Uint8Array(Buffer.from(dd, 'base64')))

