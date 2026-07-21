import { FileScanner } from "./scanner/FileScanner.js";


const scanner = new FileScanner();


const context = await scanner.scan("./examples/test-node-project");


console.log("Root:");
console.log(context.rootPath);


console.log("\nFiles found:");
console.log(context.files);


console.log("\nHas package.json?");
console.log(
    context.fileExists("package.json")
);


console.log("\nReading package.json:");
console.log(
    await context.readFile("package.json")
);