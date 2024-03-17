type IOSArtifact = {
  downloadUrl: string;
  downloadManifestUrl: string;
  manifestQrCode: string;
  manifestQrCodeUrl: string;
  size: number;
  uploadDate: string;
  metadata: Record<string, unknown>;
};

type AndroidArtifact = {
  downloadUrl: string;
  downloadQrCode: string;
  size: number;
  uploadDate: string;
  metadata: Record<string, unknown>;
};

export type Artifacts = {
  android: AndroidArtifact | null;
  ios: IOSArtifact | null;
};

export type ArtifactFile = {
  name: string;
  size: number;
  content: Buffer;
};

export type MetadataFile = {
  type: string;
  content: Buffer;
};
