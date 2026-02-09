import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");

    if (!fileName) {
        return NextResponse.json({ error: "No file specified" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "music_library", fileName);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stats = fs.statSync(filePath);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Type": "audio/mpeg", // Or dynamic based on extension
            "Content-Length": stats.size.toString(),
            "Accept-Ranges": "bytes",
        },
    });
}
