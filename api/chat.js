
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method tidak diizinkan"
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "API key belum dipasang di Vercel"
    });
  }

  try {
    const messages = req.body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Pesan masih kosong"
      });
    }

    const input = messages.slice(-12).map((m) => {
      if (
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string"
      ) {
        throw new Error("Format pesan tidak valid");
      }

      return {
        role: m.role,
        content: m.content.slice(0, 4000)
      };
    });

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.5",
          instructions:
            "Kamu adalah DanielWorst AI. Jawab dengan ramah, jelas, dan membantu dalam bahasa pengguna. Berikan jawaban yang sesuai usia.",
          input
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(502).json({
        error: "Gagal menghubungi layanan AI"
      });
    }

    return res.status(200).json({
      reply: data.output_text || "Belum ada jawaban."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Terjadi kesalahan pada server"
    });
  }
}
