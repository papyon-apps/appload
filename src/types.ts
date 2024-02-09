type IOSArtifact = {
  downloadUrl: string;
  downloadManifestUrl: string;
  manifestQrCode: string;
  manifestQrCodeUrl: string;
  metadata: Record<string, unknown>;
};

type AndroidArtifact = {
  downloadUrl: string;
  downloadQrCode: string;
  metadata: Record<string, unknown>;
};

export type Artifacts = {
  android: AndroidArtifact | null;
  ios: IOSArtifact | null;
};
