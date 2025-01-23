
import { TextEncoder, TextDecoder } from 'util'
global['TextEncoder'] = global['TextEncoder'] || TextEncoder;
global['TextDecoder'] = global['TextDecoder'] || TextDecoder;

// Polyfills fetch
// import 'whatwg-fetch'


console.info('[[[ jest.setup ]]]  ' );