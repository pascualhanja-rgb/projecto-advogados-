import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configuração server-side (credenciais ficam no .env.local, nunca no browser)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * POST /api/upload
 * multipart/form-data: { file, pasta? ("fotos" | "comprovativos") }
 * → Envia para o Cloudinary e devolve a URL estática otimizada.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "Ficheiro ausente." }, { status: 400 });
    }
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return NextResponse.json(
        { message: "Formato não suportado. Use JPG, PNG, WEBP ou PDF." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: "Ficheiro demasiado grande (máx. 10 MB)." },
        { status: 400 },
      );
    }

    const pasta = form.get("pasta") === "fotos" ? "fotos" : "comprovativos";
    const bytes = Buffer.from(await file.arrayBuffer());

    // recurso "raw" é obrigatório para PDFs; "auto" cobre imagens
    const resourceType = file.type === "application/pdf" ? "raw" : "auto";

    const resultado = await new Promise<{ secure_url: string; bytes: number }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `kizua-legal/${pasta}`,
            resource_type: resourceType,
          },
          (err, res) => {
            if (err || !res) return reject(err ?? new Error("Resposta vazia do Cloudinary"));
            resolve({ secure_url: res.secure_url, bytes: res.bytes ?? file.size });
          },
        );
        stream.end(bytes);
      },
    );

    return NextResponse.json({
      url: resultado.secure_url,
      origem: "cloudinary",
      tamanho: resultado.bytes,
    });
  } catch (err) {
    console.error("[/api/upload] erro:", err);
    return NextResponse.json({ message: "Falha ao enviar ficheiro." }, { status: 500 });
  }
}
