import { HOST, UPLOAD_DIR } from "@/constants";
import Image from "next/image";
import path from "path";
import fs from "fs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const getArtifactNames = async () => {
  const files = await fs.promises.readdir(UPLOAD_DIR);

  return files.filter((maybeDir) =>
    fs.lstatSync(path.join(UPLOAD_DIR, maybeDir)).isDirectory()
  );
};

const command = `$ curl --location --request PUT '${HOST}/api/upload' \ \r
  --form 'artifact=@"/path/to/your/artifact.zip"' \ \r
  --form 'appName="your-app-name"' --progress-bar  | cat`;

export default async function Home() {
  const artifactNames = await getArtifactNames();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-5 lg:p-24">
      <Image src="/papyon.png" alt="logo" width={200} height={200} />
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
