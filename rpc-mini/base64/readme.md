



### 实现参考

https://opensource.apple.com/source/QuickTimeStreamingServer/QuickTimeStreamingServer-452/CommonUtilitiesLib/base64.c



### 构建

https://wasmbyexample.dev/examples/hello-world/hello-world.c.en-us.html

```bash

$ brew install llvm
$ /usr/local/opt/llvm/bin/llc --version
Homebrew LLVM version 15.0.5
  Optimized build.
  Default target: x86_64-apple-darwin21.6.0
  Host CPU: icelake-client

  Registered Targets:
    aarch64    - AArch64 (little endian)
    aarch64_32 - AArch64 (little endian ILP32)
    wasm32     - WebAssembly 32-bit
    wasm64     - WebAssembly 64-bit
    x86        - 32-bit X86: Pentium-Pro and above
    x86-64     - 64-bit X86: EM64T and AMD64


# https://surma.dev/things/c-to-webassembly/
# Don’t try and link against a standard library
# Flags passed to the linker

# 最小，1.7 kb
$ /usr/local/opt/llvm/bin/clang --target=wasm32 -O3 -flto -nostdlib -Wl,--no-entry -Wl,--export-all -Wl,--lto-O3 -o ./base64.wasm ./base64.c

# 可以再压缩下
$ brew install brotli
$ brotli base64.wasm 

#通过emcc导出的不可用。。。
$ brew install emscripten
$ emcc base64.c -o base64.js -s LINKABLE=1 -s EXPORT_ALL=1
```

或者在线编译

https://wasdk.github.io/WasmFiddle/


### 测试

python -m  http.server  
http://127.0.0.1:8000/