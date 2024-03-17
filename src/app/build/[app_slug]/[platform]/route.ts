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
    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    const adapter = new LocalFSAdapter({ uploadDir: UPLOAD_DIR });
    const metadata = await adapter.getArtifactFile(
      params.app_slug,
      params.platform
    );
    headers.set("Content-Disposition", `attachment; filename=${metadata.name}`);
    headers.set("Content-Length", metadata.size.toString());
    return new Response(metadata.content, { headers });
  } catch (err) {
    const error = err as AdapterError;
    return new Response(error.message, {
      status: error.code || 500,
    });
  }
}
