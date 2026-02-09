import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "music_library");
        await mkdir(uploadDir, { recursive: true });

        const uploadedTracks = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filePath = path.join(uploadDir, file.name);

            await writeFile(filePath, buffer);
            uploadedTracks.push({
                name: file.name,
                url: `/api/music?file=${encodeURIComponent(file.name)}`
            });
        }

        return NextResponse.json({ success: true, tracks: uploadedTracks });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
