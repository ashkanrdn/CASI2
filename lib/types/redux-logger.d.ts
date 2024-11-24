declare module 'redux-logger' {
    import { Middleware } from '@reduxjs/toolkit';

    const logger: Middleware;
    export default logger;
} 
