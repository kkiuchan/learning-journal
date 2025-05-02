"use client";

import { motion } from "framer-motion";

interface AnimatedPageProps {
  children: React.ReactNode;
}

const contentAnimation = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const childAnimation = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div variants={contentAnimation} initial="initial" animate="animate">
      <motion.div variants={childAnimation}>{children}</motion.div>
    </motion.div>
  );
}
