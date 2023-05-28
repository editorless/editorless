import { Octokit } from "@octokit/rest";
import { Endpoints } from "@octokit/types";

import {
  PromiseFsClient,
  addRemote,
  checkout,
  clone,
  init,
  listBranches,
} from "isomorphic-git";
import * as http from "isomorphic-git/http/node";

import S3FS from "./s3fs";
import { AuthData } from "./token";

export default class Git {
  private constructor(authData: AuthData) {
    this.fs = S3FS.create();
    this.authData = authData;
    this.octokit = new Octokit({ auth: authData.token });
  }

  private fs: PromiseFsClient;
  private octokit: Octokit;
  private authData: AuthData;

  private static instance: Record<string, Git> = {};

  async isInitialized() {
    try {
      await this.fs.promises.stat(`${this.authData.id}/config`);
      return true;
    } catch {}

    // The config can exist on GitHub, but not on the S3
    // So, we need to check if the config exists on GitHub

    const repos = await this.getRepos("owner");
    const repo = repos.find((repo) => repo.name === "editorless");

    if (repo) {
      try {
        await clone({
          fs: this.fs,
          http: http,
          dir: `${this.authData.id}/config`,
          url: `https://${this.authData.username}:${this.authData.token}@github.com/${repo.owner.login}/${repo.name}.git`,
        });

        return true;
      } catch (e) {
        console.error(e);
      }
    }

    const userRepo = repos.find((repo) => repo.name === this.authData.username);
    if (userRepo) {
      try {
        await clone({
          fs: this.fs,
          http: http,
          dir: `${this.authData.id}/config`,
          url: `https://${this.authData.username}:${this.authData.token}@github.com/${userRepo.owner.login}/${userRepo.name}.git`,
        });
      } catch {
        return false;
      }

      try {
        const branches = await listBranches({
          fs: this.fs,
          dir: `${this.authData.id}/config`,
          remote: "origin",
        });

        if (branches.includes("editorless")) {
          await checkout({
            fs: this.fs,
            dir: `${this.authData.id}/config`,
            ref: "editorless",
          });
          return true;
        }

        await this.cleanupConfig();
      } catch {
        await this.cleanupConfig();
      }

      return false;
    }

    return false;
  }

  async cleanupConfig(includeGitDir = true) {
    const files = await this.fs.promises.readdir(`${this.authData.id}/config`, {
      recursive: true,
    });

    await Promise.allSettled(
      files.map((file: string) => {
        if (!includeGitDir) {
          if (file.startsWith(".git")) {
            return new Promise((res) => res(undefined));
          }
        }

        return this.fs.promises.unlink(`${this.authData.id}/config/${file}`);
      })
    );
  }

  async getRepos(type?: Endpoints["GET /user/repos"]["parameters"]["type"]) {
    let repos: Endpoints["GET /user/repos"]["response"]["data"] = [];

    let page = 1;
    while (true) {
      const result = await this.octokit.rest.repos.listForAuthenticatedUser({
        type,
        per_page: 100,
        page,
      });

      if (result.data.length === 0) {
        break;
      }
      repos = [...repos, ...result.data];
      page++;
    }

    return repos;
  }

  async getForks() {
    const repos = await this.getRepos("owner");

    return repos.filter((repo) => repo.fork);
  }

  async getRepo(owner: string, repo: string) {
    const result = await this.octokit.rest.repos.get({
      owner,
      repo,
    });

    return result.data;
  }

  async createRepo(name: string, localName?: string) {
    await this.octokit.rest.repos.createForAuthenticatedUser({
      name,
    });

    await init({
      fs: this.fs,
      dir: `${this.authData.id}/${localName || name}`,
    });

    await addRemote({
      fs: this.fs,
      dir: `${this.authData.id}/${name}`,
      remote: "origin",
      url: `https://${this.authData.username}:${this.authData.token}@github.com/${this.authData.username}/${name}.git`,
    });
  }

  // async createUserRepoFolder() {
  //   const username = this.authData.username;

  //   await clone({
  //     fs: this.fs,
  //     http: http,
  //     dir: `${this.authData.id}/config`,
  //     url: `https://${username}:${this.authData.token}@github.com/${username}/${username}.git`,
  //   });

  //   await this.cleanupConfig(false);

  //   await commit({
  //     fs: this.fs,
  //     dir: `${this.authData.id}/config`,
  //     message: "Initial commit",
  //     author: {
  //       name: this.authData.name,
  //       email: this.authData.email,
  //     },
  //     ref: "editorless",
  //   });

  //   await checkout({
  //     fs: this.fs,
  //     dir: `${this.authData.id}/config`,
  //     ref: "editorless",
  //   });

  //   await push({
  //     fs: this.fs,
  //     http: http,
  //     dir: `${this.authData.id}/config`,
  //     remote: "origin",
  //     ref: "HEAD",
  //     remoteRef: "editorless",
  //   });
  // }

  async createFork(owner: string, repo: string) {
    return this.octokit.rest.repos.createFork({
      owner,
      repo,
    });
  }

  static async getInstance(authData: AuthData) {
    if (!(authData.token in Git.instance)) {
      Git.instance[authData.token] = new Git(authData);
    }

    return Git.instance[authData.token];
  }
}
