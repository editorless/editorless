"use client";
import axios from "axios";
import { FormEvent, useState } from "react";

type Props = {
  className?: string;
  username: string;
  hasUserRepo: boolean;
};

type Options = "create_repo" | "create_folder_userrepo" | undefined;

export default function Form({ className, username, hasUserRepo }: Props) {
  const [option, setOption] = useState<Options>();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await axios.post("/api/git/init", {
      type: option,
    });

    window.location.href = "/app/setup/2";
  };

  return (
    <div className={className}>
      <p className="text-xl font-semibold">Config Location</p>
      <p className="mt-3 text-gray-600">
        Editorless need a place to save your configs. You can choose a location
        to save your configs.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="flex mt-3">
          <input
            id="option1"
            name="config-location"
            type="radio"
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
            checked={option === "create_repo"}
            onChange={() => setOption("create_repo")}
          />
          <label htmlFor="option1" className="ml-3">
            <p className="font-bold">Create a repository for Editorless</p>
            <p className="text-gray-600">
              Creates private &quot;editorless&quot; repository in your GitHub
              account.
            </p>
          </label>
        </div>
        <div className={`mt-3 ${hasUserRepo ? "flex" : "hidden"}`}>
          <input
            id="option2"
            name="config-location"
            type="radio"
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
            checked={option === "create_folder_userrepo"}
            onChange={() => setOption("create_folder_userrepo")}
          />
          <label htmlFor="option2" className="ml-3">
            <p className="font-bold">
              Create a branch in your account repository
            </p>
            <p className="text-gray-600">
              Creates a branch named &quot;editorless&quot; in your account
              repository ({username}/{username})
            </p>
          </label>
        </div>
        <div className="flex mt-3 justify-end">
          <button
            type="submit"
            disabled={option === undefined}
            className="mt-6 rounded-md bg-purple-600 text-white px-4 py-2 hover:bg-purple-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}
