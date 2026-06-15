import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for environments where jsdom does not provide TextEncoder/Decoder
// @ts-ignore
if (typeof (global as any).TextEncoder === 'undefined') {
    // @ts-ignore
    (global as any).TextEncoder = TextEncoder;
}
// @ts-ignore
if (typeof (global as any).TextDecoder === 'undefined') {
    // @ts-ignore
    (global as any).TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}