const fs = require('fs');
try {
    const path = 'C:/Users/madhu/.gemini/antigravity/brain/4e1c0bbe-2639-4e96-876a-b46b0da22d70/.system_generated/steps/76/output.txt';
    const raw = fs.readFileSync(path, 'utf8');
    const json = JSON.parse(raw);
    const nodes = json.data.nodes;

    const writersNode = nodes.find(n => n.id === '1a0c6839-f23b-4120-9203-d80c7ec5e1f8');
    if (writersNode) {
        writersNode.parameters.jsCode = writersNode.parameters.jsCode.replace('analysis.confidence < 0.3', 'analysis.confidence < 0.2');
    }

    const signalNode = nodes.find(n => n.id === 'aaa72f58-2106-4c7d-9e44-54ed2ee13338');
    if (signalNode) {
        signalNode.parameters.jsCode = signalNode.parameters.jsCode.replace(
            /if \(hasRealPCR && wZone !== "NEUTRAL" && wConf > 0\.3\) \{/g,
            'if (hasRealPCR && wZone !== "NEUTRAL" && wConf >= 0.2) {'
        );
        signalNode.parameters.jsCode = signalNode.parameters.jsCode.replace(
            'reasons.push(`Writers: ${wZone} (no real PCR data)`);',
            'let status = !hasRealPCR ? "No Data" : (wZone === "NEUTRAL" ? "Neutral" : "Low Confidence");\n    reasons.push(`Writers: ${status} (PCR:${wPCR.toFixed(2)}, Conf:${wConf})`);'
        );
        signalNode.parameters.jsCode = signalNode.parameters.jsCode.replace(
            'writersUsed: hasRealPCR && wZone !== "NEUTRAL" && wConf > 0.3,',
            'writersUsed: hasRealPCR && wZone !== "NEUTRAL" && wConf >= 0.2,'
        );
    }

    fs.writeFileSync('tmp_updated_nodes.json', JSON.stringify({ writers: writersNode, signal: signalNode }, null, 2));
    console.log('SUCCESS');
} catch (err) {
    console.error(err);
    process.exit(1);
}
