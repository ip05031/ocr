import OpenAI from "openai";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  try {
    const { imageBase64 } = req.body;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extrae el contenido como tabla para exportar a Excel." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const extracted = completion.choices[0].message.content;
    const rows = extracted.trim().split("\n").map((r) => r.split(/\s{2,}|\t/));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.status(200).json({ excelBase64: buffer.toString("base64") });
  } catch (err) {
    console.error("Error en función /api/convert:", err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
}
