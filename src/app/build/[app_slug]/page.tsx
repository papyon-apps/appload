import { UPLOAD_DIR } from "@/constants";
import { notFound } from "next/navigation";
import { Builds } from "@/components/Builds";
import { LocalFSAdapter } from "@/lib/adapters/LocalFSAdapter";

type Props = {
  params: {
    app_slug: string;
  };
};

const getArtifacts = async (app_slug: string) => {
  try {
    const adapter = new LocalFSAdapter({ uploadDir: UPLOAD_DIR });
    return await adapter.getArtifacts(app_slug);
  } catch (error) {
    return null;
  }
};

export default async function Page({ params }: Props) {
  const artifacts = await getArtifacts(params.app_slug);

  if (!artifacts) {
    return notFound();
  }

  return <Builds artifacts={artifacts} />;
}
