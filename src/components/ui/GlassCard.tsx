'use client';

import { HTMLMotionProps, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, ...props }, ref) => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
      <motion.div
        ref={ref}
        className={cn(
          "glass-card rounded-2xl p-6 overflow-hidden md:p-8 w-full",
          className
        )}
        initial={isMobile ? undefined : { opacity: 0, y: 20 }}
        animate={isMobile ? undefined : { opacity: 1, y: 0 }}
        exit={isMobile ? undefined : { opacity: 0, y: -20 }}
        transition={isMobile ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
