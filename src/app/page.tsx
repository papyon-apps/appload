import { UPLOAD_DIR } from "@/constants";
import Image from "next/image";
import path from "path";
import fs from "fs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { env } from "@/env";
import { LocalFSAdapter } from "@/lib/adapters/LocalFSAdapter";

export const dynamic = "force-dynamic";

const getArtifactNames = async () => {
  const adapter = new LocalFSAdapter({ uploadDir: UPLOAD_DIR });
  return await adapter.getAllArtifactNames();
};

const getExampleCommand = () => {
  return Promise.resolve(`$ curl --location --request PUT '${env.HOST}/api/upload' \ \r
  --form 'artifact=@"/path/to/your/artifact.ipa"' \ \r
  --form 'appName="your-app-name"' --progress-bar  | cat`);
};

export default async function Home() {
  const artifactNames = await getArtifactNames();
  const command = await getExampleCommand();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-5 lg:p-24">
      <Image
        priority
        src="/papyon.png"
        alt="logo"
        width={200}
        height={200}
        className="w-auto h-auto"
      />
      <h1 className="text-4xl font-bold mt-2">Artifacts Repository</h1>

      <div className="rounded-md border px-4 py-3 font-mono text-sm max-w-full overflow-x-auto mt-8">
        <pre>{command}</pre>
      </div>

      <ul className="flex flex-row gap-3 flex-wrap justify-center lg:max-w-[50%] mt-8">
        {artifactNames.map((name) => (
          <li key={name} className="text-lg mt-2">
            <Link href={`/build/${name}`}>
              <Badge variant={"outline"}>{name}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
