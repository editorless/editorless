import { PropsWithChildren } from "react";

import "styles/globals.css";

export default async function FullLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="w-full h-full">
      <body className="w-full h-full">{children}</body>
    </html>
  );
}
