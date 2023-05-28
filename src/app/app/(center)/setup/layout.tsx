import { PropsWithChildren } from "react";

export default function SetupLayout({ children }: PropsWithChildren) {
  return (
    <main className="w-full max-w-md shadow-none rounded-none sm:shadow-lg sm:rounded-lg p-6">
      <h1 className="text-2xl font-bold text-center">Welcome to Editorless!</h1>
      <p className="mt-3 text-gray-600 text-center">
        Welcome to Editorless! This setup will set up your GitHub account to
        allow Editorless Setup
      </p>
      {children}
    </main>
  );
}
