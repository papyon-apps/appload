import { UPLOAD_DIR } from "@/constants";
import path from "path";
import fs from "fs";

const HOST = process.env.HOST as string;

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

  switch (params.platform) {
    case "android": {
      const manifest = files.find((file) => file.endsWith(".android.json"));
      if (!manifest) {
        return new Response("No Android development build found", {
          status: 404,
        });
      }

      const content = fs.readFileSync(path.join(directory, manifest));
      return new Response(content, {
        headers: { "Content-Type": "application/json" },
      });
    }

    case "ios": {
      const infoPlist = files.find((file) => file.endsWith(".ios.json"));

      if (!infoPlist) {
        return new Response("No iOS development build found", { status: 404 });
      }

      const content = fs
        .readFileSync(path.join(directory, infoPlist))
        .toString();

      const info = JSON.parse(content);

      const bundleIdentifier = info.CFBundleIdentifier;
      const bundleVersion = info.CFBundleVersion;
      const appName = info.CFBundleName;

      const url = `${HOST}/build/${params.app_slug}/ios`;

      const manifest = `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
      "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">
         <dict>
            <key>items</key>
            <array>
               <dict>
                  <key>assets</key>
                  <array>
                     <dict>
                        <key>kind</key>
                        <string>software-package</string>
                        <key>url</key>
                        <string>${url}</string>
                     </dict>
                  </array>
                  <key>metadata</key>
                  <dict>
                     <key>bundle-identifier</key>
                     <string>${bundleIdentifier}</string>
                     <key>bundle-version</key>
                     <string>${bundleVersion}</string>
                     <key>kind</key>
                     <string>software</string>
                     <key>title</key>
                     <string>${appName}</string>
                  </dict>
               </dict>
            </array>
         </dict>
      </plist>`.trim();

      return new Response(manifest, {
        headers: { "Content-Type": "application/xml" },
      });
    }
  }
}
