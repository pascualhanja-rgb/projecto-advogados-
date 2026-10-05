/**
 * Teste de upload para o Cloudinary — usa a mesma lógica de /api/upload.
 * Uso: node scripts/test-upload.mjs [caminho-do-ficheiro]
 */
import { v2 as cloudinary } from "cloudinary";
import { readFileSync } from "node:fs";

// Lê o .env.local manualmente (sem dependências)
for (const linha of readFileSync(".env.local", "utf8").split("\n")) {
  const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log("Cloud:", cloudinary.config().cloud_name);

// PNG 1x1 válido embutido (ficheiro de teste)
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const caminho = process.argv[2];
const ficheiro = caminho ? readFileSync(caminho) : PNG_1PX;
const nome = caminho ?? "teste-1px.png";
const pasta = nome.toLowerCase().endsWith(".pdf") ? "comprovativos" : "fotos";
// Igual à rota /api/upload: PDFs usam resource_type "raw"
const resourceType = nome.toLowerCase().endsWith(".pdf") ? "raw" : "auto";

console.log(`A enviar ${nome} (${ficheiro.length} bytes) para kizua-legal/${pasta}…`);

try {
  const res = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `kizua-legal/${pasta}`, resource_type: resourceType },
      (err, r) => (err || !r ? reject(err ?? new Error("vazio")) : resolve(r)),
    );
    stream.end(ficheiro);
  });

  console.log("\n✅ Upload com sucesso!");
  console.log("URL estática:", res.secure_url);
  console.log("Public ID:  ", res.public_id);
  console.log("Tamanho:    ", res.bytes, "bytes");

  // Verifica se a URL está acessível publicamente
  const check = await fetch(res.secure_url, { method: "HEAD" });
  console.log(`\n${check.ok ? "✅" : "⚠️"} URL acessível publicamente (HTTP ${check.status}, ${check.headers.get("content-type")})`);
  process.exit(check.ok ? 0 : 1);
} catch (err) {
  console.error("\n❌ Falha no upload:", err?.message ?? err);
  process.exit(1);
}
