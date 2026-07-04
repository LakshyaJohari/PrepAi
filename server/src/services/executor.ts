import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface ExecutionResult {
  stdout: string;
  stderr: string;
  error: string;
}

function runCommand(
  command: string,
  input: string,
  timeoutMs: number = 5000,
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const child = exec(
      command,
      {
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024, // 1MB output limit
      },
      (error, stdout, stderr) => {
        resolve({
          stdout: stdout?.trim() || "",
          stderr: stderr?.trim() || "",
          error: error?.message || "",
        });
      },
    );

    // Send stdin input
    if (child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}

export async function executeCode(
  code: string,
  language: string,
  input: string,
): Promise<ExecutionResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "prepai-"));

  try {
    switch (language) {
      case "python": {
        const filePath = path.join(tmpDir, "solution.py");
        fs.writeFileSync(filePath, code);
        const result = await runCommand(`python "${filePath}"`, input);
        return result;
      }

      case "javascript": {
        const filePath = path.join(tmpDir, "solution.js");
        fs.writeFileSync(filePath, code);
        const result = await runCommand(`node "${filePath}"`, input);
        return result;
      }

      case 'cpp': {
  const srcPath = path.join(tmpDir, 'solution.cpp')
  const binPath = path.join(tmpDir, 'solution.exe')
  fs.writeFileSync(srcPath, code)

  // Compile
  const compile = await runCommand(
    `g++ -o "${binPath}" "${srcPath}" -std=c++17 -O2`,
    '',
    15000
  )

  console.log('Compile stdout:', compile.stdout)
  console.log('Compile stderr:', compile.stderr)
  console.log('Compile error:', compile.error)
  console.log('Bin exists:', fs.existsSync(binPath))
  console.log('Bin path:', binPath)

  if (!fs.existsSync(binPath)) {
    return { stdout: '', stderr: compile.stderr || compile.error, error: 'Compilation Error' }
  }

  const result = await runCommand(`"${binPath}"`, input)
  return result
}

      case "java": {
        const srcPath = path.join(tmpDir, "Main.java");
        fs.writeFileSync(srcPath, code);

        // Compile
        const compile = await runCommand(`javac "${srcPath}"`, "", 15000);
        if (compile.stderr) {
          return {
            stdout: "",
            stderr: compile.stderr,
            error: "Compilation Error",
          };
        }

        // Run
        const result = await runCommand(
          `java -cp "${tmpDir}" Main`,
          input,
          5000,
        );
        return result;
      }

      default:
        return { stdout: "", stderr: "", error: "Unsupported language" };
    }
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
