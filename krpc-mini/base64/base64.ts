import { WASMImpl } from "./b64wasm";

import { JsImpl } from "./b64js";

export interface Base64 {
  encode(buf: ArrayBuffer): string;
  decode(str: string): Uint8Array;
}

let impl = new JsImpl();

// const wasm: Base64 = await (async () => {
//   //   await stripe.accounts.create({
//   //     type: "express",
//   // });
//   try {
//     var it = await WXWebAssembly.instantiate("/utils/base64.wasm.br");
//     console.log("success use the wasm b64!");
//     return new WASMImpl(it);
//   } catch (err) {
//     console.log(
//       "WASM instantiation failed: " +
//         (err as Error).message +
//         ", fallback to bs64js"
//     );
//     return new JsImpl();
//   }
// })();

// let decoder: { (it: string): Uint8Array } = wasm.decode;

// let encoder: { (it: Uint8Array): string } = wasm.encode : encode;

async function init() {
  try {
    var it = await WXWebAssembly.instantiate("/utils/base64.wasm.br");
    console.log("success use the wasm b64!");
    impl = new WASMImpl(it.instance);
    // console.log(impl)
  } catch (err) {
    console.log(
      "WASM instantiation failed: " +
        (err as Error).message +
        ", fallback to bs64js"
    );
    // return new JsImpl();
  }
}
init().then(() => console.log("base64 inited :" + JSON.stringify(impl)));
// const wasm: Base64 = await init();

// await init();

/**
 * Decodes a base64 string to a byte array.
 *

 */
// export const base64decode = wasm.decode;
export function base64decode(it: string): Uint8Array {
  console.time("decode64");
  var r = impl.decode(it);
  console.timeEnd("decode64");
  return r;
}

/**
 * Encodes a byte array to a base64 string.
 * Adds padding at the end.
 * Does not insert newlines.
 */
// export const base64encode = wasm.encode;
export function base64encode(it: Uint8Array): string {
  console.time("to64str");
  var r = impl.encode(it);
  console.timeEnd("to64str");
  return r;
}
