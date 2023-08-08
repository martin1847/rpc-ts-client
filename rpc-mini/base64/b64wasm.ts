import { InputProto, OutputProto } from "bt-rpc-base";
import { Base64 } from "./base64";

const BYTES_PER_PAGE = 64 * 1024;

function ensureMemory(
  memory: WebAssembly.Memory,
  pointer: number,
  targetLength: number
) {
  const availableMemory = memory.buffer.byteLength - pointer;
  if (availableMemory < targetLength) {
    const nPages = Math.ceil((targetLength - availableMemory) / BYTES_PER_PAGE);
    memory.grow(nPages);
  }
}

// const bs2u8 = (bs: BufferSource) =>
//   bs instanceof ArrayBuffer
//     ? new Uint8Array(bs)
//     : new Uint8Array(bs.buffer, bs.byteOffset, bs.byteLength);

export class WASMImpl implements Base64 {
  instance: WebAssembly.Instance;

  constructor(instance: WebAssembly.Instance) {
    //   const { instance } = await WebAssembly.instantiate(decodedWASM);
    //   const { instance } = await WebAssembly.instantiate(decodedWASM);
    this.instance = instance;
  }

  encode(buf: ArrayBuffer): string {
    // console.time('wasm');
    const exports = this.instance.exports;
    const memory = exports.memory as WebAssembly.Memory;
    const c_Base64encode_len = exports.Base64encode_len as Function;
    const c_Base64encode = exports.Base64encode as Function;

    // const [pString, stringLen] = writeIntoMemory(instance, memory, bufferSource);

    const pString = (exports.__heap_base as any).value;
    const stringLen = buf.byteLength;
    ensureMemory(memory, pString, stringLen);

    // +1 so we so we have an extra byte for the string termination char '\0'
    const string = new Uint8Array(memory.buffer, pString, stringLen + 1);
    string.set(new Uint8Array(buf));
    string[stringLen] = 0;

    const pEncoded = pString + stringLen;
    const encodedLen: number = c_Base64encode_len(stringLen);
    ensureMemory(memory, pEncoded, encodedLen);

    const encodedLenReal: number = c_Base64encode(pEncoded, pString, stringLen);
    // console.timeEnd('wasm');

    // -1 so we don't include string termination char '\0'
    const encoded = new Uint8Array(memory.buffer, pEncoded, encodedLenReal - 1);

    // NOTE: Interestingly, most of the runtime is spent building the string.
    //       As far as I know, this is still the fastest way.
    // console.time('text');
    const str = OutputProto.textDecode(encoded);
    // console.timeEnd('text');

    return str;
  }

  decode(str: string): Uint8Array {
    const exports = this.instance.exports;
    const memory = exports.memory as WebAssembly.Memory;
    const c_Base64decode_len = exports.Base64decode_len as Function;
    const c_Base64decode = exports.Base64decode as Function;

    // console.time('textEncodeIntoMemory');
    // const [pBufCoded, bufCodedLen] =
    //   textEncodeIntoMemory(instance, memory, str, encoder);
    // console.timeEnd('textEncodeIntoMemory');
    const pBufCoded = (exports.__heap_base as any).value;
    const bufCodedLen = str.length;
    ensureMemory(memory, pBufCoded, bufCodedLen);

    const bufCoded = new Uint8Array(memory.buffer, pBufCoded, bufCodedLen + 1);
    // textEncodeInto(encoder, bufCoded, str);
    bufCoded.set(InputProto.textEncode(str));
    bufCoded[bufCodedLen] = 0;

    // return [pBufCoded, bufCodedLen]
    // console.time('c_Base64decode_len');
    const pBufPlain = pBufCoded + bufCodedLen;
    const bufPlainLen: number = c_Base64decode_len(pBufCoded);
    ensureMemory(memory, pBufPlain, bufPlainLen);
    // console.timeEnd('c_Base64decode_len');

    // console.time('c_Base64decode');
    const lenReal: number = c_Base64decode(pBufPlain, pBufCoded);
    const bufPlain = new Uint8Array(memory.buffer, pBufPlain, lenReal);
    // console.timeEnd('c_Base64decode');

    // Return a copy to avoid returning a view directly into WASM memory.
    // console.time('slice');
    const ret = bufPlain.slice();
    // console.timeEnd('slice');

    return ret;
  }
}
