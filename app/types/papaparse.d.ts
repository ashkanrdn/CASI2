declare module 'papaparse' {
    interface ParseConfig<T> {
        header?: boolean;
        complete?: (results: ParseResult<T>) => void;
        error?: (error: Error) => void;
        dynamicTyping?: boolean;
    }

    interface ParseResult<T> {
        data: T[];
        errors: Array<{
            type: string;
            code: string;
            message: string;
            row: number;
        }>;
        meta: {
            delimiter: string;
            linebreak: string;
            aborted: boolean;
            truncated: boolean;
            cursor: number;
        };
    }

    function parse<T>(
        input: string,
        config?: ParseConfig<T>
    ): ParseResult<T>;

    const Papa: {
        parse: typeof parse;
    };

    export default Papa;
} 
