import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <Image src="/papyon.png" alt="logo" width={200} height={200} />
      <h1 className="text-4xl font-bold mt-2">Artifacts Repository</h1>
    </main>
  );
}
