import { PropsWithChildren } from "react";

export default function CenterLayout({ children }: PropsWithChildren) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      {children}
    </div>
  );
}
