import { AdapterBase } from "./AdapterBase";
import slugify from "slugify";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import { ManifestParser } from "@/lib/extract-tools/manifest";
import { env } from "@/env";
import { parsePlist } from "../extract-tools/plist-parse";
import { ArtifactFile, Artifacts, MetadataFile } from "@/types";
import qrcode from "qrcode";
import {
  InvalidFileError,
  NotFoundError,
  NotSupportedPlatformError,
} from "./Errors";

type LocalFSAdapterOptions = {
  uploadDir: string;
};
export class LocalFSAdapter implements AdapterBase {
  private options: LocalFSAdapterOptions;

  constructor(options: LocalFSAdapterOptions) {
    this.options = options;
  }

  async saveArtifact(name: string, file: File): Promise<string> {
    const extension = file.name.split(".").pop();
    const appSlug = `${slugify(name, {
      lower: true,
      remove: /[*+~.()'"!:@\/]/g,
    })}`;

    const artifactFile = await file.arrayBuffer();
    const artifactBuffer = Buffer.from(artifactFile);

    const dirPath = path.join(this.options.uploadDir, appSlug);
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
          throw new InvalidFileError(
            "Invalid APK file, no AndroidManifest.xml found"
          );
        }

        const manifest = new ManifestParser(
          Buffer.from(manifestBuffer)
        ).parse();
        const versionCode = manifest.versionCode as number | undefined;
        const packageName = manifest.package as string | undefined;

        if (!versionCode || !packageName) {
          throw new InvalidFileError(
            "Invalid APK file, no versionCode or package name found"
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
        fs.writeFileSync(path.join(dirPath, `android.apk`), artifactBuffer);
        // write metadata
        fs.writeFileSync(
          path.join(dirPath, `metadata.android.json`),
          JSON.stringify(manifest, null, 2)
        );

        return `${env.HOST}/build/${appSlug}`;
      }

      case "ipa": {
        const archive = await JSZip.loadAsync(artifactBuffer);

        const rawInfoPlist = await archive
          .file(/Payload\/[^/]+\/Info.plist/)[0]
          ?.async("uint8array");

        if (!rawInfoPlist) {
          throw new InvalidFileError("Invalid IPA file, no Info.plist found");
        }

        const plist = parsePlist(rawInfoPlist) as
          | Record<string, any>
          | undefined;

        if (typeof plist !== "object") {
          throw new InvalidFileError(
            "Invalid IPA file, Info.plist is not a valid plist"
          );
        }

        const version = plist.CFBundleVersion as string | undefined;
        const bundleId = plist.CFBundleIdentifier as string | undefined;

        if (!version || !bundleId) {
          throw new InvalidFileError(
            "Invalid IPA file, no CFBundleVersion or CFBundleIdentifier found"
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
        fs.writeFileSync(path.join(dirPath, `ios.ipa`), artifactBuffer);

        // write metadata
        fs.writeFileSync(
          path.join(dirPath, `metadata.ios.json`),
          JSON.stringify(plist, null, 2)
        );

        return `${env.HOST}/build/${appSlug}`;
      }

      default: {
        throw new NotSupportedPlatformError("Invalid file extension");
      }
    }
  }

  async getArtifacts(name: string): Promise<Artifacts> {
    const directory = path.join(this.options.uploadDir, name);

    if (!fs.existsSync(directory)) {
      throw new NotFoundError("No Development build found");
    }

    const artifacts: Artifacts = {
      android: null,
      ios: null,
    };

    const files = fs.readdirSync(directory);

    for await (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const size = fs.statSync(path.join(directory, file)).size;
      const createdAt = fs.statSync(path.join(directory, file)).birthtime;
      switch (ext) {
        case ".apk": {
          const metadata = files.find((file) => file.endsWith(".android.json"));
          const metadataContent = fs
            .readFileSync(path.join(directory, metadata!))
            .toString();

          const qrCode = await qrcode.toDataURL(
            `${env.HOST}/build/${name}/android`
          );
          artifacts.android = {
            downloadUrl: `/build/${name}/android`,
            downloadQrCode: qrCode,
            size,
            uploadDate: createdAt.toISOString(),
            metadata: JSON.parse(metadataContent),
          };
          break;
        }
        case ".ipa": {
          const metadata = files.find((file) => file.endsWith(".ios.json"));
          const metadataContent = fs
            .readFileSync(path.join(directory, metadata!))
            .toString();

          const manifestUrl = `/build/${name}/ios/manifest`;
          const manifestQrCodeUrl = `itms-services://?action=download-manifest&amp;url=${env.HOST}${manifestUrl}`;
          const manifestQrCode = await qrcode.toDataURL(manifestQrCodeUrl);
          artifacts.ios = {
            downloadUrl: `/build/${name}/ios`,
            downloadManifestUrl: manifestUrl,
            manifestQrCode: manifestQrCode,
            manifestQrCodeUrl,
            size,
            uploadDate: createdAt.toISOString(),
            metadata: JSON.parse(metadataContent),
          };
          break;
        }
      }
    }

    return artifacts;
  }

  getArtifactFile(
    name: string,
    platform: "ios" | "android"
  ): Promise<ArtifactFile> {
    const directory = path.join(this.options.uploadDir, name);

    if (!fs.existsSync(directory)) {
      throw new NotFoundError("No Development build found");
    }

    const files = fs.readdirSync(directory);

    switch (platform) {
      case "ios": {
        const iosBuild = files.find((file) => file.endsWith(".ipa"));
        if (!iosBuild) {
          throw new Error("No iOS development build found");
        }
        const size = fs.statSync(path.join(directory, iosBuild)).size;

        const content = fs.readFileSync(path.join(directory, iosBuild));

        return Promise.resolve({ content, size, name: iosBuild });
      }
      case "android": {
        const androidBuild = files.find((file) => file.endsWith(".apk"));
        if (!androidBuild) {
          throw new Error("No Android development build found");
        }
        const size = fs.statSync(path.join(directory, androidBuild)).size;

        const content = fs.readFileSync(path.join(directory, androidBuild));

        return Promise.resolve({ content, size, name: androidBuild });
      }
    }
  }

  getArtifactManifest(
    name: string,
    platform: "ios" | "android"
  ): Promise<MetadataFile> {
    const directory = path.join(this.options.uploadDir, name);

    if (!fs.existsSync(directory)) {
      throw new NotFoundError("No Development build found");
    }

    const files = fs.readdirSync(directory);

    switch (platform) {
      case "android": {
        const manifest = files.find((file) => file.endsWith(".android.json"));
        if (!manifest) {
          throw new NotFoundError("No Android development build found");
        }

        const content = fs.readFileSync(path.join(directory, manifest));
        return Promise.resolve({ content, type: "application/json" });
      }

      case "ios": {
        const infoPlist = files.find((file) => file.endsWith(".ios.json"));

        if (!infoPlist) {
          throw new NotFoundError("No iOS development build found");
        }

        const content = fs
          .readFileSync(path.join(directory, infoPlist))
          .toString();

        const info = JSON.parse(content);

        const bundleIdentifier = info.CFBundleIdentifier;
        const bundleVersion = info.CFBundleVersion;
        const appName = info.CFBundleName;

        const url = `${env.HOST}/build/${name}/ios`;

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

        return Promise.resolve({
          content: Buffer.from(manifest),
          type: "application/xml",
        });
      }
    }
  }

  async getAllArtifactNames() {
    const files = await fs.promises.readdir(this.options.uploadDir);

    return files.filter((maybeDir) =>
      fs.lstatSync(path.join(this.options.uploadDir, maybeDir)).isDirectory()
    );
  }
}
