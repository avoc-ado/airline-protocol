import { spawn } from "node:child_process";

const runCommand = ({ command, cwd, env }) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      env: { ...process.env, ...env },
      shell: true,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed (${code}): ${command}`));
    });
  });

const runCommands = async ({ commands, cwd, env }) => {
  for (const command of commands) {
    await runCommand({ command, cwd, env });
  }
};

export { runCommand, runCommands };
