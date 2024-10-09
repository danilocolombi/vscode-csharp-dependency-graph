import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as os from "os";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "csharp-dependency-graph.generate",
    async () => {
      const fileName =
        os.platform() === "win32"
          ? "\\dependency-graph.dot"
          : "/dependency-graph.dot";
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const defaultFilePath =
        workspaceFolders === undefined
          ? fileName
          : workspaceFolders[0].uri.fsPath + fileName;

      const filePath = await vscode.window.showInputBox({
        placeHolder: "Enter the file path to save the graph",
        prompt: "Output file path",
        value: defaultFilePath,
        validateInput: (input) => {
          const dirPath = path.dirname(input);
          if (!input) {
            return "Output file path cannot be empty";
          } else if (!input.endsWith(".dot")) {
            return "Output file path must be a .dot file";
          } else if (!fs.existsSync(dirPath)) {
            return "Directory doesn't exist, please choose a valid path";
          }
          return null;
        },
      });

      const graph = generateProjectGraph();

      if (graph === undefined) {
        return;
      }

      try {
        fs.writeFileSync(filePath!, graph);
        vscode.window.showInformationMessage("File created at: " + filePath);
      } catch (err) {
        vscode.window.showErrorMessage("Error occured: " + err);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

function generateProjectGraph(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace provided");
    return undefined;
  }

  const workspacePath = workspaceFolders[0].uri.fsPath;

  if (!isSolutionDirectory(workspacePath)) {
    vscode.window.showErrorMessage(
      "Solution file not found, execute the command from the root of the solution"
    );
    return undefined;
  }

  const csprojFiles = findCsprojFiles(workspacePath);

  if (csprojFiles.length === 0) {
    return undefined;
  }

  let dependenciesMap = new Map<string, string[]>();
  if (csprojFiles.length > 0) {
    csprojFiles.forEach((file, index) => {
      const content = getCsprojContent(file.path);

      let deps: string[] = [];
      for (let i = 0; i < csprojFiles.length; i++) {
        if (i === index) {
          continue;
        }

        if (content.includes(csprojFiles[i].name)) {
          deps.push(csprojFiles[i].name);
        }
      }

      dependenciesMap.set(file.name, deps);
    });

    let dependenciesGraph = "";

    dependenciesMap.forEach((value, key) => {
      value.forEach((value) => {
        dependenciesGraph += `"${key}"->"${value}";`;
      });
    });

    const digraph = `
		digraph G{
			${dependenciesGraph}
  }`;

    return digraph;
  }

  return "";
}

function isSolutionDirectory(dir: string): boolean {
  const files = fs.readdirSync(dir);
  return files.some((f) => f.endsWith(".sln"));
}

function findCsprojFiles(dir: string): CsProjFile[] {
  let results: CsProjFile[] = [];

  const files = fs.readdirSync(dir);

  files.forEach((file: string) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(findCsprojFiles(filePath));
    } else if (
      file.endsWith(".csproj") &&
      !file.toLowerCase().includes("test")
    ) {
      const csProjFile: CsProjFile = {
        name: path.basename(filePath, path.extname(filePath)),
        path: filePath,
      };
      results.push(csProjFile);
    }
  });

  return results;
}

function getCsprojContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return "";
  }
}

export interface CsProjFile {
  name: string;
  path: string;
}
