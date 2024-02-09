import { UPLOAD_DIR } from "@/constants";
import path from "path";
import fs from "fs";

type Params = {
  params: {
    app_slug: string;
    platform: "ios" | "android";
  };
};

export function GET(request: Request, { params }: Params) {
  const directory = path.join(UPLOAD_DIR, params.app_slug);

  if (!fs.existsSync(directory)) {
    return new Response("No Development build found", { status: 404 });
  }

  const files = fs.readdirSync(directory);

  const headers = new Headers();

  headers.set("Content-Type", "application/octet-stream");

  switch (params.platform) {
    case "ios": {
      const iosBuild = files.find((file) => file.endsWith(".ipa"));
      if (!iosBuild) {
        return new Response("No iOS development build found", { status: 404 });
      }
      headers.set("Content-Disposition", `attachment; filename=${iosBuild}`);
      const content = fs.readFileSync(path.join(directory, iosBuild));

      return new Response(content, { headers });
    }
    case "android": {
      const androidBuild = files.find((file) => file.endsWith(".apk"));
      if (!androidBuild) {
        return new Response("No Android development build found", {
          status: 404,
        });
      }
      headers.set(
        "Content-Disposition",
        `attachment; filename=${androidBuild}`
      );
      const content = fs.readFileSync(path.join(directory, androidBuild));

      return new Response(content, { headers });
    }
  }
  return new Response("Hello worker!", { status: 200 });
}
