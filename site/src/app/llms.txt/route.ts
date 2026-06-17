import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const GET = () => {
  const filePath = path.join(process.cwd(), "src/docs.md");
  const content = fs.readFileSync(filePath, "utf8");
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
