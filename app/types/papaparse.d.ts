declare module 'papaparse' {
    import type { ParseConfig, ParseResult } from './papaparse';

    export function parse<T>(
        input: string,
        config?: ParseConfig<T>
    ): ParseResult<T>;

    const Papa: {
        parse: typeof parse;
    };

    export default Papa;
} 
