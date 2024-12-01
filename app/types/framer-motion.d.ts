declare module 'framer-motion' {
    import * as React from 'react';

    export interface MotionProps {
        initial?: any;
        animate?: any;
        exit?: any;
        transition?: any;
        layout?: boolean;
        layoutId?: string;
        whileHover?: any;
        whileTap?: any;
    }

    export interface AnimatePresenceProps {
        initial?: boolean;
        custom?: any;
        children?: React.ReactNode;
    }

    export const motion: {
        div: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLDivElement>>;
        p: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLParagraphElement>>;
        h3: React.ForwardRefExoticComponent<MotionProps & React.HTMLAttributes<HTMLHeadingElement>>;
    };

    export const AnimatePresence: React.FC<AnimatePresenceProps>;
} 
