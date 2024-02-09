import { UPLOAD_DIR } from "@/constants";
import path from "path";
import fs from "fs";
import { notFound } from "next/navigation";
import qrcode from 'qrcode'
import Image from "next/image";

type Props = {
    params: {
        app_slug: string
    }
}

type IOSArtifact = {
    downloadUrl: string
    metadata: { downloadManifestUrl: string, manifestQrCode: string }
}

type AndroidArtifact = {
    downloadUrl: string
    metadata: unknown | null
}

type Artifacts = {
    android: AndroidArtifact | null
    ios: IOSArtifact | null

}

const HOST = process.env.HOST as string;

const getArtifacts = async (app_slug: string) => {
    const directory = path.join(UPLOAD_DIR, app_slug);

    if (!fs.existsSync(directory)) {
        return null;
    }

    const artifacts: Artifacts = {
        android: null,
        ios: null
    }

    const files = fs.readdirSync(directory);

    for await (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext === ".apk") {
            artifacts.android = {
                downloadUrl: `/build/${app_slug}/android`,
                metadata: null
            }
        } else if (ext === ".ipa") {
            const manifestUrl = `/build/${app_slug}/ios/manifest`;

            const qrCode = await qrcode.toDataURL(`itms-services://?action=download-manifest&amp;url=${HOST}${manifestUrl}`);
            artifacts.ios = {
                downloadUrl: `/build/${app_slug}/ios`,
                metadata: {
                    downloadManifestUrl: manifestUrl,
                    manifestQrCode: qrCode
                }
            }
        }
    }

    return artifacts;
}


export default async function Page({ params }: Props) {
    const artifacts = await getArtifacts(params.app_slug);


    if (!artifacts) {
        return notFound();
    }
    return <div>
        <h1>Builds</h1>
        <ul>
            {artifacts.android && <li><a href={artifacts.android.downloadUrl}>Android</a></li>}
            {artifacts.ios && (<li><a href={artifacts.ios.downloadUrl}>iOS</a>
                <ul>
                    <li><a href={artifacts.ios.metadata.downloadManifestUrl}>Manifest</a></li>
                    <li><Image width={300} height={300} src={artifacts.ios.metadata.manifestQrCode} alt="iOS Manifest QR Code" /></li>
                </ul>
            </li>
            )}
        </ul>
    </div>
}