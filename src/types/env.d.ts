declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BASE_URL: string;
      GITHUB_CLIENT_ID: string;

      GITHUB_CLIENT_SECRET: string;

      AWS_REGION: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;

      AWS_S3_BUCKET_NAME: string;
    }
  }
}

export {};
