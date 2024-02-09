import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { ManifestParser } from "@/utils/extract-tools/manifest";
import slugify from "slugify";
import { UPLOAD_DIR } from "@/constants";
import * as PlistParser from "plist";

const ALLOWED_EXTENSIONS = ["apk", "ipa"];

export async function PUT(req: Request) {
  const formdata = await req.formData();
  const appName = formdata.get("appName");
  const artifact = formdata.get("artifact");

  if (!appName || typeof appName !== "string") {
    return NextResponse.json(
      { message: "No `appName` provided or invalid type" },
      { status: 400 }
    );
  }

  if (!artifact || !(artifact instanceof File)) {
    return NextResponse.json(
      { message: "No file uploaded `artifact`" },
      { status: 400 }
    );
  }

  const extension = artifact.name.split(".").pop();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return NextResponse.json(
      {
        message: `Invalid file extension, only ${ALLOWED_EXTENSIONS.join(
          ", "
        )} are allowed`,
      },
      { status: 400 }
    );
  }

  const appSlug = `${slugify(appName, { lower: true })}`;

  const artifactFile = await artifact.arrayBuffer();
  const artifactBuffer = Buffer.from(artifactFile);

  const dirPath = path.join(UPLOAD_DIR, appSlug);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  switch (extension) {
    case "apk": {
      const archive = await JSZip.loadAsync(artifactBuffer);

      const manifestBuffer = await archive
        .file("AndroidManifest.xml")
        ?.async("arraybuffer");
      if (!manifestBuffer) {
        return NextResponse.json(
          { message: "Invalid APK file, no AndroidManifest.xml found" },
          { status: 400 }
        );
      }

      const manifest = new ManifestParser(Buffer.from(manifestBuffer)).parse();
      const versionCode = manifest.versionCode as number | undefined;
      const packageName = manifest.package as string | undefined;

      if (!versionCode || !packageName) {
        return NextResponse.json(
          { message: "Invalid APK file, no versionCode or package name found" },
          { status: 400 }
        );
      }

      // cleanup old apk files
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith(".apk") || file.endsWith(".android.json")) {
          fs.unlinkSync(path.join(dirPath, file));
        }
      }

      // write new apk file
      fs.writeFileSync(
        path.join(
          dirPath,
          `${packageName.replaceAll(".", "_")}-${versionCode}.apk`
        ),
        artifactBuffer
      );
      // write metadata
      fs.writeFileSync(
        path.join(
          dirPath,
          `${packageName.replaceAll(".", "_")}-${versionCode}.android.json`
        ),
        JSON.stringify(manifest, null, 2)
      );

      return NextResponse.json(`/artifact/${appSlug}`);
    }

    case "ipa": {
      const archive = await JSZip.loadAsync(artifactBuffer);

      const rawInfoPlist = await archive
        .file(/Payload\/[^/]+\/Info.plist/)[0]
        ?.async("text");

      if (!rawInfoPlist) {
        return NextResponse.json(
          { message: "Invalid IPA file, no Info.plist found" },
          { status: 400 }
        );
      }

      const plist = PlistParser.parse(rawInfoPlist) as
        | Record<string, unknown>
        | undefined;

      if (typeof plist !== "object") {
        return NextResponse.json(
          { message: "Invalid IPA file, Info.plist is not a valid plist" },
          { status: 400 }
        );
      }

      const version = plist.CFBundleVersion as string | undefined;
      const bundleId = plist.CFBundleIdentifier as string | undefined;

      if (!version || !bundleId) {
        return NextResponse.json(
          {
            message:
              "Invalid IPA file, no CFBundleVersion or CFBundleIdentifier found",
          },
          { status: 400 }
        );
      }

      // cleanup old ipa files
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith(".ipa") || file.endsWith(".ios.json")) {
          fs.unlinkSync(path.join(dirPath, file));
        }
      }

      // write new ipa file
      fs.writeFileSync(
        path.join(dirPath, `${bundleId.replaceAll(".", "_")}-${version}.ipa`),
        artifactBuffer
      );

      // write metadata
      fs.writeFileSync(
        path.join(
          dirPath,
          `${bundleId.replaceAll(".", "_")}-${version}.ios.json`
        ),
        JSON.stringify(plist, null, 2)
      );

      return NextResponse.json(`/artifact/${appSlug}`);
    }

    default: {
      return NextResponse.json(
        { message: "Invalid file extension, only .apk or .ipa are allowed" },
        { status: 400 }
      );
    }
  }
}
