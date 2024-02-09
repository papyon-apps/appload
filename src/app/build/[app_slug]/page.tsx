import { HOST, UPLOAD_DIR } from "@/constants";
import path from "path";
import fs from "fs";
import { notFound } from "next/navigation";
import qrcode from "qrcode";
import { Artifacts } from "@/types";
import { Builds } from "@/components/Builds";

type Props = {
  params: {
    app_slug: string;
  };
};

const getArtifacts = async (app_slug: string) => {
  const directory = path.join(UPLOAD_DIR, app_slug);

  if (!fs.existsSync(directory)) {
    return null;
  }

  const artifacts: Artifacts = {
    android: null,
    ios: null,
  };

  const files = fs.readdirSync(directory);

  for await (const file of files) {
    const ext = path.extname(file).toLowerCase();
    switch (ext) {
      case ".apk": {
        const metadata = files.find((file) => file.endsWith(".android.json"));
        const metadataContent = fs
          .readFileSync(path.join(directory, metadata!))
          .toString();

        const qrCode = await qrcode.toDataURL(
          `${HOST}/build/${app_slug}/android`
        );
        artifacts.android = {
          downloadUrl: `/build/${app_slug}/android`,
          downloadQrCode: qrCode,
          metadata: JSON.parse(metadataContent),
        };
        break;
      }
      case ".ipa": {
        const metadata = files.find((file) => file.endsWith(".ios.json"));
        const metadataContent = fs
          .readFileSync(path.join(directory, metadata!))
          .toString();

        const manifestUrl = `/build/${app_slug}/ios/manifest`;
        const manifestQrCodeUrl = `itms-services://?action=download-manifest&amp;url=${HOST}${manifestUrl}`;
        const manifestQrCode = await qrcode.toDataURL(manifestQrCodeUrl);
        artifacts.ios = {
          downloadUrl: `/build/${app_slug}/ios`,
          downloadManifestUrl: manifestUrl,
          manifestQrCode: manifestQrCode,
          manifestQrCodeUrl,
          metadata: JSON.parse(metadataContent),
        };
        break;
      }
    }
  }

  return artifacts;
};

export default async function Page({ params }: Props) {
  const artifacts = await getArtifacts(params.app_slug);

  if (!artifacts) {
    return notFound();
  }

  return <Builds artifacts={artifacts} />;
}
