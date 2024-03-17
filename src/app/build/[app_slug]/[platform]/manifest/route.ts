import { UPLOAD_DIR } from "@/constants";
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
  } catch (error) {
    console.error(error);
    return new Response((error as Error).message, { status: 500 });
  }
}
