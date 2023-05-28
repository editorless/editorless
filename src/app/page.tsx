import { Metadata } from "next";

export default async function Home() {
  return (
    <main className="">
      <header className="shadow-md">
        <div className="container flex items-center mx-auto p-6">
          <h1 className="text-2xl font-bold">Editorless</h1>
          <div className="flex-1" />
          <div>
            <a
              className="px-6 py-2 rounded-md bg-purple-600 text-white font-bold"
              href="/app"
            >
              Start Editing
            </a>
          </div>
        </div>
      </header>
      <div className="h-[600px] flex flex-col justify-center items-center">
        <p className="text-4xl font-bold">Editorless</p>
        <p className="mt-3 text-2xl">Edit your Jekyll Blog without an Editor</p>
        <a
          href="/app"
          className="mt-6 px-6 py-2 rounded-md bg-purple-600 text-white font-bold"
        >
          Start Editing
        </a>
      </div>
      <div className="h-[600px] flex flex-col justify-center items-center bg-gray-800">
        <p className="text-white text-4xl font-bold">
          Focused on editing experience
        </p>
        <p className="text-white mt-3 text-2xl">
          Forget text editor, use rich editor!
        </p>
      </div>
    </main>
  );
}

export const metadata: Metadata = {
  title: "Editorless - Edit your website without an editor",
};
