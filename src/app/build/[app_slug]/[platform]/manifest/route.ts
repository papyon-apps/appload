import { UPLOAD_DIR } from "@/constants";
import { AdapterError } from "@/lib/adapters/Errors";
import { LocalFSAdapter } from "@/lib/adapters/LocalFSAdapter";

type Params = {
  params: {
    app_slug: string;
    platform: "ios" | "android";
  };
};

export async function GET(request: Request, { params }: Params) {
  try {
    const adapter = new LocalFSAdapter({ uploadDir: UPLOAD_DIR });
    const metadata = await adapter.getArtifactManifest(
      params.app_slug,
      params.platform
    );
    return new Response(metadata.content, {
      headers: {
        "Content-Type": metadata.type,
      },
    });
  } catch (err) {
    const error = err as AdapterError;
    return new Response(error.message, {
      status: error.code || 500,
    });
  }
}
