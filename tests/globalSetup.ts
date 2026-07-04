import { spawn, type ChildProcess } from "node:child_process";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

process.env.CAEDRAL_BASE_URL ??= "http://localhost:5001";
process.env.OPENROUTER_API_KEY ??= "sk-or-test-mock-key";

const BASE_URL = process.env.CAEDRAL_BASE_URL;

let gatewayProcess: ChildProcess | null = null;

async function isGatewayHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForGateway(timeoutMs = 45_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isGatewayHealthy()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `Caedral API gateway not reachable at ${BASE_URL}. Start it with: cd api-gateway && npm run dev`,
  );
}

function stopGatewayProcess() {
  if (!gatewayProcess || gatewayProcess.killed) return;

  if (process.platform === "win32" && gatewayProcess.pid) {
    spawn("taskkill", ["/pid", String(gatewayProcess.pid), "/t", "/f"], {
      shell: true,
      stdio: "ignore",
    });
  } else {
    gatewayProcess.kill("SIGTERM");
  }

  gatewayProcess = null;
}

export default async function globalSetup() {
  if (await isGatewayHealthy()) {
    return async () => {};
  }

  const gatewayDir = resolve(process.cwd(), "../api-gateway");
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  gatewayProcess = spawn(npmCmd, ["run", "dev"], {
    cwd: gatewayDir,
    stdio: "pipe",
    env: { ...process.env },
  });

  gatewayProcess.stderr?.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    if (text.includes("Error") || text.includes("listening")) {
      process.stderr.write(`[gateway] ${text}`);
    }
  });

  await waitForGateway();

  return async () => {
    stopGatewayProcess();
  };
}
