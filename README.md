# C# Dependency Graph

A simple VS Code extension that generates a graph of your project dependencies.
![](https://github.com/danilocolombi/vscode-csharp-dependency-graph/blob/main/images/demo.gif?raw=true)

## Requirements
This extension generates a .dot file that can be opened with [Graphviz](https://graphviz.org/). You can preview the graph in VS Code by installing a Graphiviz viewer extension, in the example above I used [Graphviz Preview](https://marketplace.visualstudio.com/items?itemName=tintinweb.graphviz-interactive-preview).

# How to Generate the .dot file
1. From your solution directory, open the command prompt (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)  and type > `Generate Dependency Graph`
2. Choose the file path
3. Select weather you want to show the project version or not
3. The file should be created.

# How to Preview the .dot file with Graphviz Interactive Preview
1. Open the file in VS Code
2. Open the command prompt (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type > `Preview Graphviz / Dot`

# Skipping Test Projects
This extension will skip projects that have a `test` folder in the path.

# License
MIT

# Contributing
Contributions are welcome! Please open an issue or submit a pull request.


