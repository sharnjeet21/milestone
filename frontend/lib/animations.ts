import { useEffect, useState } from "react";
import {
  useMotionValue,
  useSpring,
  type MotionValue,
  type SpringOptions,
  type Variants,
} from "framer-motion";

type CountUpOptions = SpringOptions & {
  initial?: number;
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export const staggerContainer: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export function countUp(
  value: number,
  options: CountUpOptions = {},
): { value: number; motionValue: MotionValue<number> } {
  const { initial = 0, stiffness = 90, damping = 16, ...rest } = options;
  const motionValue = useMotionValue(initial);
  const spring = useSpring(motionValue, { stiffness, damping, ...rest });
  const [displayValue, setDisplayValue] = useState(initial);

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(latest);
    });

    return unsubscribe;
  }, [spring]);

  return { value: displayValue, motionValue };
}
