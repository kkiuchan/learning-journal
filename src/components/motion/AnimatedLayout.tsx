"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface AnimatedLayoutProps {
  children: React.ReactNode;
}

const pageTransition = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  transition: {
    duration: 0.3,
    ease: "easeOut",
  },
};

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-2 py-4 md:px-4 md:py-8">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial="initial"
          animate="animate"
          variants={pageTransition}
          transition={pageTransition.transition}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
