// Parchea el runtime de las Serverless Functions que emite @astrojs/vercel@7,
// que solo conoce Node 18/20 y cae a `nodejs18.x` (rechazado por Vercel).
// Lo deja en `nodejs24.x`, válido y alineado con engines.node de package.json.
// Sin .vercel/output (builds locales con el adaptador de Node) no hace nada.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const RUNTIME = "nodejs24.x";
const functionsDir = join(process.cwd(), ".vercel", "output", "functions");

if (!existsSync(functionsDir)) {
  console.log("[fix-vercel-runtime] sin .vercel/output/functions, nada que parchear.");
  process.exit(0);
}

let patched = 0;
for (const entry of readdirSync(functionsDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.endsWith(".func")) continue;
  const vcConfigPath = join(functionsDir, entry.name, ".vc-config.json");
  if (!existsSync(vcConfigPath)) continue;
  const config = JSON.parse(readFileSync(vcConfigPath, "utf8"));
  if (config.runtime === RUNTIME) continue;
  config.runtime = RUNTIME;
  writeFileSync(vcConfigPath, JSON.stringify(config, null, 2) + "\n");
  patched++;
  console.log(`[fix-vercel-runtime] ${entry.name}: runtime -> ${RUNTIME}`);
}

console.log(`[fix-vercel-runtime] listo, ${patched} funcion(es) parcheada(s).`);
