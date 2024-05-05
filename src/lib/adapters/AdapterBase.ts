import { ArtifactFile, Artifacts, MetadataFile } from "@/types";

export interface AdapterBase {
  saveArtifact(name: string, file: File): Promise<string>;
  getArtifacts(name: string): Promise<Artifacts | null>;
  getArtifactFile(
    name: string,
    platform: "ios" | "android"
  ): Promise<ArtifactFile>;
  getArtifactManifest(
    name: string,
    platform: "ios" | "android"
  ): Promise<MetadataFile>;
  getAllArtifactNames(): Promise<string[]>;
}
