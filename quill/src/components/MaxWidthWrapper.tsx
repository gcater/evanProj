import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import React from "react";

const MaxWisdthWrapper = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): JSX.Element => {
  return (
    <div
      className={cn("mx-auto w-full max-w-screen-x1 px-2.5 md:px-2", className)}
    >
      {children}
    </div>
  );
};

export default MaxWisdthWrapper;
