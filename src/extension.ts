import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as os from "os";
import { CsProjFile } from "./csproj-file";
import { CsprojFileDetails } from "./csproj-file-details";

const LABEL_SHOW_DOTNET_VERSION = "Show .NET version";
const DEFAULT_GRAPH_FILE_NAME = "dependency-graph.dot";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "csharp-dependency-graph.generate",
    async () => {
      const filePath = await vscode.window.showInputBox({
        placeHolder: "Enter the file path to save the graph",
        prompt: "Output file path",
        value: buildDefaultFilePath(),
        validateInput: validateFilePath,
      });
      const config = await vscode.window.showQuickPick(
        [LABEL_SHOW_DOTNET_VERSION],
        {
          canPickMany: true,
          title: "Show:",
        }
      );

      const showVersion =
        config?.some((op) => op === LABEL_SHOW_DOTNET_VERSION) ?? false;

      const graph = generateProjectGraph(showVersion);

      if (graph === undefined || filePath === undefined) {
        return;
      }

      try {
        fs.writeFileSync(filePath, graph);
        vscode.window.showInformationMessage("File created at: " + filePath);
      } catch (err) {
        vscode.window.showErrorMessage("Unexpected error: " + err);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

function buildDefaultFilePath(): string {
  const directorySeparator = os.platform() === "win32" ? "\\" : "/";
  const fileName = directorySeparator + DEFAULT_GRAPH_FILE_NAME;
  return vscode.workspace.workspaceFolders === undefined
    ? fileName
    : vscode.workspace.workspaceFolders[0].uri.fsPath + fileName;
}

function validateFilePath(input: string): string | null {
  const dirPath = path.dirname(input);
  if (!input) {
    return "Output file path cannot be empty";
  } else if (!input.endsWith(".dot")) {
    return "Output file path must be a .dot file";
  } else if (!fs.existsSync(dirPath)) {
    return "Directory doesn't exist, please choose a valid path";
  }
  return null;
}

function generateProjectGraph(showDotnetVersion: boolean): string | undefined {
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
    vscode.window.showErrorMessage("No csproj files found");
    return undefined;
  }

  const csprojFilesDetails: CsprojFileDetails[] = csprojFiles.map(
    (file, index) => {
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

      return {
        name: file.name,
        dependencies: deps,
        dotnetVersion: showDotnetVersion ? extractProjectVersion(content) : "",
      };
    }
  );

  return generateDigraphTemplate(csprojFilesDetails, showDotnetVersion);
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

function extractProjectVersion(content: string) {
  const targetFrameworkTag = "<TargetFramework>";
  const indexOfTargetFramework = content.indexOf(targetFrameworkTag);

  let versionPosition = indexOfTargetFramework + targetFrameworkTag.length;

  let version = "";
  while (content[versionPosition] !== "<") {
    version = version + content[versionPosition];
    versionPosition += 1;
  }

  return version;
}

function generateDigraphTemplate(
  csprojFileDetails: CsprojFileDetails[],
  showDotnetVersion: boolean
) {
  let dependenciesGraph = "";

  csprojFileDetails.forEach((csproj) => {
    if (showDotnetVersion) {
      dependenciesGraph += `"${csproj.name}" [
            label=<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">
                <TR><TD><FONT POINT-SIZE="14">${csproj.name}</FONT></TD></TR>
                <TR><TD><FONT POINT-SIZE="10">${csproj.dotnetVersion}</FONT></TD></TR>
              </TABLE>>
        ];`;
    }
    csproj.dependencies.forEach((deps) => {
      dependenciesGraph += `"${csproj.name}"->"${deps}";`;
    });
  });

  const digraph = `
		digraph G{
      node [shape = box;];
			${dependenciesGraph}
  }`;

  return digraph;
}
