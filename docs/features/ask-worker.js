// Web Worker host for the in-browser guide model. Running WebLLM here (instead of
// the main thread) isolates the WebGPU work from the page, which avoids the
// "Buffer was unmapped before mapping was resolved" race that hits main-thread
// inference (notably when the tab isn't the focused window). Workers also have
// first-class OPFS access for the cached weights.
import * as webllm from 'https://esm.run/@mlc-ai/web-llm';
const handler = new webllm.WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
