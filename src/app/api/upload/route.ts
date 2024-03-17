import { NextResponse } from "next/server";
import { LocalFSAdapter } from "@/lib/adapters/LocalFSAdapter";
import { UPLOAD_DIR } from "@/constants";
import { AdapterError } from "@/lib/adapters/Errors";

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

  try {
    const adapter = new LocalFSAdapter({ uploadDir: UPLOAD_DIR });

    const result = await adapter.saveArtifact(appName, artifact);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const error = err as AdapterError;
    return new Response(error.message, {
      status: error.code || 500,
    });
  }
}
