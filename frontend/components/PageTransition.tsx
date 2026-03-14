"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { fadeIn } from "@/lib/animations";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
