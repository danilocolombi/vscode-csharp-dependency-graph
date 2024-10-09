# C# Dependency Graph

A simple VS Code extension that generates a graph of your project dependencies.
![](https://github.com/danilocolombi/vscode-csharp-dependency-graph/blob/main/images/demo.gif?raw=true)

## Requirements
This extension generates a .dot file that can be opened with [Graphviz](https://graphviz.org/). You can preview the graph in VS Code by installing a Graphiviz viewer extension, in the example above I used [Graphviz Preview](https://marketplace.visualstudio.com/items?itemName=tintinweb.graphviz-interactive-preview).

# How to Generate the .dot file
(a) From your solution directory, open the command prompt (cmd+shift+p) and type > Generate Dependency Graph
(b) Choose the file path
(c) The file should be created.

# How to Preview the .dot file with Graphviz Interactive Preview
(a) Open the file in VS Code
(a) Open the command prompt (cmd+shift+p) and type > Preview Graphviz / Dot

# License
MIT

# Contributing
Contributions are welcome! Please open an issue or submit a pull request.


