import { access, cp, mkdir, mkdtemp, readFile, rename, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCommand } from "../lib/run.mjs";

const ensureFile = async ({ filePath }) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const resolveWorkspaceRoot = ({ manifestPath }) => {
  const resolvedManifestPath = path.resolve(process.cwd(), manifestPath);
  const manifestDir = path.dirname(resolvedManifestPath);
  return path.resolve(manifestDir, "..", "..");
};

const buildInTemp = async ({ manifestPath, programName }) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "airline-program-build-"));
  const sourceDir = path.dirname(path.resolve(process.cwd(), manifestPath));
  const tempProgramDir = path.join(tempRoot, programName);
  const tempManifestPath = path.join(tempProgramDir, "Cargo.toml");
  const tempDeployDir = path.join(tempRoot, "target", "deploy");

  await cp(sourceDir, tempProgramDir, { recursive: true });
  await runCommand({
    command: `cargo build-sbf --manifest-path ${tempManifestPath} --sbf-out-dir ${tempDeployDir}`
  });

  const outputPath = path.join(tempDeployDir, `${programName}.so`);
  const destinationDir = path.join(process.cwd(), "target", "deploy");
  const destinationPath = path.join(destinationDir, `${programName}.so`);

  await mkdir(destinationDir, { recursive: true });
  await cp(outputPath, destinationPath);
  await rm(tempRoot, { recursive: true, force: true });
};

const buildWithFallbacks = async ({ manifestPath, programName }) => {
  if (await isUnsupportedLockfile({ manifestPath })) {
    await buildInTemp({ manifestPath, programName });
    return;
  }

  const commands = [
    `cargo build-sbf --manifest-path ${manifestPath} --sbf-out-dir target/deploy`,
    `cargo build-bpf --manifest-path ${manifestPath} --sbf-out-dir target/deploy`
  ];

  let lastError = null;

  for (const command of commands) {
    try {
      await withSafeLockfile({
        manifestPath,
        action: () => runCommand({ command })
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to build Solana program");
};

const workspaceLockPath = ({ manifestPath }) =>
  path.join(resolveWorkspaceRoot({ manifestPath }), "Cargo.lock");
const workspaceLockBackupPath = ({ manifestPath }) =>
  path.join(resolveWorkspaceRoot({ manifestPath }), "Cargo.lock.bak");

const isUnsupportedLockfile = async ({ manifestPath }) => {
  try {
    const contents = await readFile(workspaceLockPath({ manifestPath }), "utf8");
    return contents.includes("version = 4");
  } catch {
    return false;
  }
};

const withSafeLockfile = async ({ manifestPath, action }) => {
  const hasUnsupportedLockfile = await isUnsupportedLockfile({ manifestPath });
  if (!hasUnsupportedLockfile) {
    return action();
  }

  const lockPath = workspaceLockPath({ manifestPath });
  const backupPath = workspaceLockBackupPath({ manifestPath });

  await rename(lockPath, backupPath);

  try {
    return await action();
  } finally {
    await rm(lockPath, { force: true });
    await rename(backupPath, lockPath);
  }
};

const ensureProgramArtifact = async ({ programId, programName, manifestPath }) => {
  const deployDir = path.join("target", "deploy");
  const deployPath = path.join(deployDir, `${programName}.so`);

  if (!(await ensureFile({ filePath: deployPath }))) {
    await buildWithFallbacks({ manifestPath, programName });
  }

  if (!(await ensureFile({ filePath: deployPath }))) {
    throw new Error(`Missing program artifact at ${deployPath}`);
  }

  return {
    programId,
    deployPath
  };
};

export { ensureProgramArtifact };
