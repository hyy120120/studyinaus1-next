"use client";

// Lightweight, reusable reveal-on-scroll wrapper. Purely additive polish —
// no layout, spacing, or content changes. Respects prefers-reduced-motion.
import { motion, useReducedMotion } from "framer-motion";

const DIRECTIONS = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { y: 0, x: 20 },
    right: { y: 0, x: -20 },
    none: { y: 0, x: 0 },
};

export default function Reveal({
    children,
    as = "div",
    direction = "up",
    delay = 0,
    duration = 0.6,
    once = true,
    amount = 0.2,
    className,
    ...rest
}) {
    const shouldReduceMotion = useReducedMotion();
    const MotionTag = motion[as] || motion.div;
    const offset = DIRECTIONS[direction] || DIRECTIONS.up;

    if (shouldReduceMotion) {
        const Tag = as;
        return (
            <Tag className={className} {...rest}>
                {children}
            </Tag>
        );
    }

    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, y: offset.y, x: offset.x }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once, amount }}
            transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
            {...rest}
        >
            {children}
        </MotionTag>
    );
}
