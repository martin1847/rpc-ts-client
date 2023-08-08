/**
 * Protobuf binary format wire types.
 *
 * A wire type provides just enough information to find the length of the
 * following value.
 *
 * See https://developers.google.com/protocol-buffers/docs/encoding#structure
 * https://github.com/timostamm/protobuf-ts/blob/master/packages/runtime/src/binary-format-contract.ts
 */

export enum WireType {
  /**
   * Used for int32, int64, uint32, uint64, sint32, sint64, bool, enum
   */
  Varint = 0,

  /**
   * Used for fixed64, sfixed64, double.
   * Always 8 bytes with little-endian byte order.
   */
  Bit64 = 1,

  /**
   * Used for string, bytes, embedded messages, packed repeated fields
   *
   * Only repeated numeric types (types which use the varint, 32-bit,
   * or 64-bit wire types) can be packed. In proto3, such fields are
   * packed by default.
   */
  LengthDelimited = 2,

  /**
   * Used for groups
   * @deprecated
   */
  StartGroup = 3,

  /**
   * Used for groups
   * @deprecated
   */
  EndGroup = 4,

  /**
   * Used for fixed32, sfixed32, float.
   * Always 4 bytes with little-endian byte order.
   */
  Bit32 = 5,
}

export class InputProto {
  static textEncode: (s: string) => ArrayLike<number> =
    typeof TextEncoder !== 'undefined'
      ? (it) => new TextEncoder().encode(it)
      : (it) =>
          unescape(encodeURIComponent(it))
            .split('')
            .map((val) => val.charCodeAt(0));

  private u8?: string;
  setUtf8(value: string) {
    this.u8 = value;
  }

  static serializeBinary(it: InputProto): Uint8Array {
    return it.serializeBinary();
  }

  /**
   * message InputProto { string utf8 = 2; }
   */
  serializeBinary(): Uint8Array {
    let buf: number[] = [];
    this.uint32(((2 << 3) | WireType.LengthDelimited) >>> 0, buf);
    let txtBytes = this.u8 ? InputProto.textEncode(this.u8) : [];
    //https://developers.weixin.qq.com/community/develop/doc/000e280b104b38e5cb1b062d25ac00
    // let txtBytes = this.u8
    //   ? unescape(encodeURIComponent(this.u8))
    //       .split('')
    //       .map((val) => val.charCodeAt(0))
    //   : [];
    this.uint32(txtBytes.length, buf); // // write length of chunk as varint
    let offset = buf.length;
    let pb = new Uint8Array(offset + txtBytes.length);
    pb.set(buf, 0);
    pb.set(txtBytes, offset);
    return pb;
  }

  private uint32(value: number, buf: number[]) {
    // write value as varint 32, inlined for speed
    while (value > 0x7f) {
      buf.push((value & 0x7f) | 0x80);
      value = value >>> 7;
    }
    buf.push(value);
  }
}

// https://en.wikipedia.org/wiki/UTF-8#Encoding
// ignoreBOM == false
// http://www.onicos.com/staff/iz/amuse/javascript/expert/utf.txt
/* utf.js - UTF-8 <=> UTF-16 convertion
 *
 * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.1 by Martin.Cong
 * LastModified: Dec 16 2022
 * This library is free.  You can redistribute it and/or modify it.
 */
function u8decode(u8: Uint8Array): string {
  var out = '',
    len = u8.length;
  for (var i = 0, c, h4; i < len; ) {
    c = u8[i++];
    if (c > 0x7f) {
      // not ascii , 0xxxxxxx 1byte
      h4 = c >> 4;
      if (h4 == 0b1110) {
        // 1110xxxx 3byte , chinese here , first check
        c = ((c & 0x0f) << 12) | ((u8[i++] & 0x3f) << 6) | (u8[i++] & 0x3f);
      } else if (h4 >> 1 == 0b110) {
        // 110xxxxx 2byte
        c = ((c & 0x1f) << 6) | (u8[i++] & 0x3f);
      } else if (h4 == 0b1111) {
        // 11110xxx 4byte
        c = ((c & 0x07) << 18) | ((u8[i++] & 0x3f) << 12) | ((u8[i++] & 0x3f) << 6) | (u8[i++] & 0x3f);
      } else {
        // error u8 char or miss some bytes. ignore.
        continue;
      }
    }
    out += String.fromCodePoint(c);
  }
  return out;
}

//https://github.com/timostamm/protobuf-ts/blob/master/packages/runtime/src/binary-reader.ts
export class OutputProto {
  static textDecode: { (u8: Uint8Array): string } =
    typeof TextDecoder !== 'undefined'
      ? (it) => new TextDecoder('utf-8').decode(it) //, {fatal: true,ignoreBOM: true}
      : u8decode;
  /**
   * Current position.
   */
  private pos: number;

  /**
   * Number of bytes available in this reader.
   */
  private readonly len: number;

  private readonly buf: Uint8Array;

  c: number;
  m?: string;
  utf8?: string;
  bs?: Uint8Array;
  dc?: OutputProto.DataCase;

  constructor(buf: Uint8Array) {
    this.buf = buf;
    this.len = buf.length;
    this.pos = 0;
    this.c = 0;
    // this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    // let textDecoder = new TextDecoder('utf-8', {
    //   fatal: true,
    //   ignoreBOM: true,
    // });

    // function decodeU8arr(u8arr: Uint8Array) {
    //   return textDecoder.decode(u8arr);
    //   // return decodeURIComponent(escape(String.fromCharCode(...u8arr)));
    // }

    while (this.pos < this.len) {
      let tag = this.varint32read(),
        fieldNo = tag >>> 3,
        wireType = tag & 7;
      // console.log("found tag : " + tag + ",  fieldNo: "+fieldNo +" ,wireType: "+wireType)

      if (fieldNo <= 0 || wireType < 0 || wireType > 5) {
        throw new Error('illegal tag: field no ' + fieldNo + ' wire type ' + wireType);
      }
      switch (fieldNo) {
        case /* int32 c */ 1:
          this.c = this.varint32read() | 0;
          break;
        case /* string m */ 2:
          this.dc = OutputProto.DataCase.M;
          this.m = OutputProto.textDecode(this.bytesRead());
          break;
        case /* string utf8 */ 3:
          this.dc = OutputProto.DataCase.UTF8;
          this.utf8 = OutputProto.textDecode(this.bytesRead());
          break;
        case /* bytes bs */ 4:
          this.dc = OutputProto.DataCase.BS;
          this.bs = this.bytesRead();
          break;
        default:
          this.skip(wireType);
        // throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) !`);
      }
    }
  }

  static deserializeBinary(buf: Uint8Array): OutputProto {
    return new OutputProto(buf);
  }

  /**
   * Read a `uint32` field, an unsigned 32 bit varint.
   */
  private varint32read(): number {
    let b = this.buf[this.pos++];
    let result = b & 0x7f;
    if ((b & 0x80) == 0) {
      this.assertBounds();
      return result;
    }

    b = this.buf[this.pos++];
    result |= (b & 0x7f) << 7;
    if ((b & 0x80) == 0) {
      this.assertBounds();
      return result;
    }

    b = this.buf[this.pos++];
    result |= (b & 0x7f) << 14;
    if ((b & 0x80) == 0) {
      this.assertBounds();
      return result;
    }

    b = this.buf[this.pos++];
    result |= (b & 0x7f) << 21;
    if ((b & 0x80) == 0) {
      this.assertBounds();
      return result;
    }

    // Extract only last 4 bits
    b = this.buf[this.pos++];
    result |= (b & 0x0f) << 28;

    for (let readBytes = 5; (b & 0x80) !== 0 && readBytes < 10; readBytes++) b = this.buf[this.pos++];

    if ((b & 0x80) != 0) throw new Error('invalid varint');

    this.assertBounds();

    // Result can have 32 bits, convert it to unsigned
    return result >>> 0;
  }

  private assertBounds(): void {
    if (this.pos > this.len) throw new RangeError('premature EOF');
  }

  /**
   * Read a `bytes` field, length-delimited arbitrary data.
   */
  private bytesRead(): Uint8Array {
    let len = this.varint32read();
    let start = this.pos;
    this.pos += len;
    return this.buf.subarray(start, start + len);
  }

  private skip(wireType: WireType): Uint8Array {
    let start = this.pos;
    // noinspection FallThroughInSwitchStatementJS
    switch (wireType) {
      case WireType.Varint:
        while (this.buf[this.pos++] & 0x80) {
          // ignore
        }
        break;
      case WireType.Bit64:
        this.pos += 4;
      case WireType.Bit32:
        this.pos += 4;
        break;
      case WireType.LengthDelimited:
        let len = this.varint32read();
        this.pos += len;
        break;
      // case WireType.StartGroup:
      //     // From descriptor.proto: Group type is deprecated, not supported in proto3.
      //     // But we must still be able to parse and treat as unknown.
      //     let t: WireType
      //     while ((t = this.tag()[1]) !== WireType.EndGroup) {
      //         this.skip(t);
      //     }
      //     break;
      default:
        throw new Error('cant skip wire type ' + wireType);
    }
    this.assertBounds();
    return this.buf.subarray(start, this.pos);
  }

  getDataCase(): OutputProto.DataCase {
    return this.dc!;
  }

  getC(): number {
    return this.c;
  }
  getM(): string {
    return this.m!;
  }
  getUtf8(): string {
    return this.utf8!;
  }
  getBs(): Uint8Array {
    return this.bs!;
  }
}

export namespace OutputProto {
  export enum DataCase {
    DATA_NOT_SET = 0,
    M = 2,
    UTF8 = 3,
    BS = 4,
  }
}
