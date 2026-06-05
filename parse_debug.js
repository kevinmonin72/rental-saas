const fs = require('fs');
const readline = require('readline');

async function debug() {
  const fileStream = fs.createReadStream('/Users/kevinmonin/.gemini/antigravity-cli/brain/c7fe1c7d-87ea-4366-bb38-e7f60b9bfad6/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let latestMsg = "";
  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes("pour 1 jour logo-lokki-solutions")) {
      latestMsg = obj.content;
    }
  }

  const chunks = latestMsg.split(/logo-lokki-solutions/);
  console.log("Number of chunks: " + chunks.length);
  
  if (chunks[2]) {
     const lines = chunks[2].split('\n');
     for (let i = 0; i < 20; i++) {
        console.log(`[CHUNK 2 LINE ${i}] ${lines[i]}`);
     }
  }
}
debug();
