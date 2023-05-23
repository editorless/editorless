import { Octokit } from "@octokit/rest";
import { Endpoints } from "@octokit/types";

import { PromiseFsClient, clone } from "isomorphic-git";
import * as http from "isomorphic-git/http/node";

import S3FS from "./s3fs";

export default class Git {
  private constructor(token: string) {
    this.fs = S3FS.create();
    this.token = token;
    this.octokit = new Octokit({ auth: token });
  }

  private fs: PromiseFsClient;
  private octokit: Octokit;
  private token: string;

  private userData?: Endpoints["GET /user"]["response"]["data"];

  private static instance: Record<string, Git> = {};

  private async initialize() {
    const octokit = new Octokit({ auth: this.token });
    const { data: userData } = await octokit.rest.users.getAuthenticated();

    this.userData = userData;

    const forks = await this.getForks();

    const forkQueries = await Promise.allSettled(
      forks.map((fork) => this.getRepo(fork.owner.login, fork.name))
    );

    const forkQueryResults = forkQueries.filter(
      (forkQuery) => forkQuery.status === "fulfilled"
    ) as PromiseFulfilledResult<
      Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"]
    >[];

    let fork = forkQueryResults.find(
      (result) =>
        result.value.parent?.owner.login === process.env.GIT_PARENT_OWNER &&
        result.value.parent?.name === process.env.GIT_PARENT_REPO
    )?.value;

    if (!fork) {
      await this.createFork(
        process.env.GIT_PARENT_OWNER,
        process.env.GIT_PARENT_REPO
      );
      fork = await this.getRepo(userData.login, process.env.GIT_PARENT_REPO);
    }

    try {
      await this.fs.promises.stat(`${userData.id}/.git`);
    } catch {
      clone({
        fs: this.fs,
        http,
        dir: `${userData.id}`,
        url: `https://${userData.login}:${this.token}@github.com/${userData.login}/${fork.name}`,
      });
    }
  }

  private async getForks() {
    let repos: Endpoints["GET /user/repos"]["response"]["data"] = [];

    let page = 1;
    while (true) {
      const result = await this.octokit.rest.repos.listForAuthenticatedUser({
        type: "owner",
        per_page: 100,
        page,
      });

      if (result.data.length === 0) {
        break;
      }
      repos = [...repos, ...result.data];
      page++;
    }

    return repos.filter((repo) => repo.fork);
  }

  private async getRepo(owner: string, repo: string) {
    const result = await this.octokit.rest.repos.get({
      owner,
      repo,
    });

    return result.data;
  }

  private async createFork(owner: string, repo: string) {
    return this.octokit.rest.repos.createFork({
      owner,
      repo,
    });
  }

  static async getInstance(token: string) {
    if (!(token in Git.instance)) {
      Git.instance[token] = new Git(token);
      await Git.instance[token].initialize();
    }

    return Git.instance[token];
  }
}
