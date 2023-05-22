import { PropsWithChildren } from "react";
import "styles/globals.css";

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
