import { Meta, RpcError, OutputProto } from './index';
import { GrpcStatusCode } from './grpc-status-code';

export const HEADER_SIZE = 5;

/**
 * A grpc-frame type. Can be used to determine type of frame emitted by
 * `readGrpcWebResponseBody()`.
 */
export enum GrpcWebFrame {
  DATA = 0x00,
  TRAILER = 0x80,
}

/**
 * Packs the serialized message into a grpc-web data frame.
 */
export function frameRequest(protobuf: Uint8Array): Uint8Array {
  //不考虑超出int32的情况，需要分多个data frame,服务端再concatenate all frames into one byte array
  //https://github.com/grpc/grpc-web/blob/master/src/connector/src/main/java/io/grpcweb/MessageDeframer.java
  let len = protobuf.length;
  // we need 5 bytes for frame type header + message length
  let body = new Uint8Array(HEADER_SIZE + len);
  // first byte is frame type
  body[0] = GrpcWebFrame.DATA;
  // 4 bytes message length,big-endian
  body[1] = (len >> 24) & 0xff;
  body[2] = (len >> 16) & 0xff;
  body[3] = (len >> 8) & 0xff;
  body[4] = len & 0xff;
  // for (let msgLen = protobuf.length, i = 4; i > 0; i--) {
  //   body[i] = msgLen & 0xFF;
  //   msgLen >>>= 8;
  // }
  body.set(protobuf, 5); // the rest is message
  return body;
}

/**
 * 解析状态码header; text-base64 正常情况下tailer里面不回显 grpc-status:0
 */
export function parseStatus(headers: Meta): [GrpcStatusCode?, string?] {
  let s = headers['grpc-status'];
  let code = s ? parseInt(s, 10) : undefined;
  // if (s !== undefined) {
  //
  //   // if (GrpcStatusCode[code] !== undefined)
  //   // return [code, msg];

  //   // return [GrpcStatusCode.INTERNAL, 'invalid grpc-web status : ' + s];
  // }
  return [code, headers['grpc-message']];
  // throw new RpcError(GrpcStatusCode.INTERNAL, 'Response closed with invalid grpc-status (Trailers provided) : ' + s);
  // return [code, message];
}

/**
 * 解析响应body，返回Data + Tailer?
 * https://github.com/grpc/grpc-web/blob/master/src/connector/src/main/java/io/grpcweb/RequestHandler.java#L148
 * 如果有Error，先设置Transfer-Encoding: chunked （ CRLF（\r\n）结尾，Content-Length omitted ，跳过data body部分 ），再设置("trailer", "grpc-status,grpc-message"),直接`writeError`只写TRAILER Frame就返回了；
 * 否则写完data frame，再追加Status.OK (grpc-status&grpc-message) TRAILER Frame.
 *
 * Trailers-only responses: no change to the gRPC protocol spec. Trailers may be sent together with response headers, with no message in the body.
 * https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md
 */
export function parseBodyFrame(bodyBs: Uint8Array): [Uint8Array, string?] {
  if (bodyBs.length === 0) {
    //异常情况下由于Transfer-Encoding: chunked，到body这里就是空的了。
    //trailer 部分作为 chunked 会被解析到header里面去
    //https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Transfer-Encoding#directives
    //when larger amounts of data are sent to the client and the total size may not be known
    //until the request has been fully processed.
    return [bodyBs];
  }

  if (bodyBs[0] == GrpcWebFrame.DATA) {
    let msgLen = 0;
    for (let i = 1; i < HEADER_SIZE; i++) msgLen = (msgLen << 8) + bodyBs[i];
    // let msgLen2 =  new DataView(byteQueue.buffer,0,HEADER_SIZE).getUint32(1, false);

    var trunkIndex = HEADER_SIZE + msgLen;
    if (bodyBs.length >= trunkIndex) {
      // first is the data frame
      var dataTrunk = bodyBs.subarray(HEADER_SIZE, trunkIndex);

      if (bodyBs.length > (trunkIndex += HEADER_SIZE)) {
        // the reset is all the trailer frame
        return [dataTrunk, OutputProto.textDecode(bodyBs.subarray(trunkIndex))];
      }
      return [dataTrunk];
    }
  }
  // else if(isTrailerFrame(first)){
  //   return new Metadata()
  // }
  throw new RpcError(GrpcStatusCode.DATA_LOSS, 'not support trunk with magic: ' + bodyBs[0]);
}
