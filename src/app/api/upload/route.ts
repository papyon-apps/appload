import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { ManifestParser } from "@/utils/extract-tools/manifest";
import slugify from "slugify";
import { UPLOAD_DIR } from "@/constants";

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

  if (extension === "apk") {
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
      if (file.endsWith(".apk")) {
        fs.unlinkSync(path.join(dirPath, file));
      }
    }

    fs.writeFileSync(
      path.join(
        dirPath,
        `${packageName.replaceAll(".", "_")}-${versionCode}.apk`
      ),
      artifactBuffer
    );
  } else {
    fs.writeFileSync(path.join(dirPath, artifact.name), artifactBuffer);
  }

  return NextResponse.json(`/artifact/${appSlug}`);
}
