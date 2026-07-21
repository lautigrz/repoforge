import { BootstrapEngine } from "./engines/DetectorEngine.js";
import {
    Analyzer,
    DetectorEngine,
    FileScanner
} from "./index.js";

import { NodeRuntimeDetector, DetectorRegistry, NodeEcosystemProvider } from "@repoforge/detectors";

const analyzer = new Analyzer(

    new FileScanner(),

    new BootstrapEngine([
        new NodeRuntimeDetector()
    ]),

    new DetectorRegistry([
        new NodeEcosystemProvider()
    ])

);


const result = await analyzer.analyze(
    "./examples/test-node-project"
);


console.log(result);