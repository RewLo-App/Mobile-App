import { spawnSync } from "node:child_process";

const environment = { ...process.env, NODE_ENV: "development" };

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: environment });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ["./build.mjs"]);
run(process.execPath, ["--enable-source-maps", "./dist/index.mjs"]);
