"use client";

import { Artifacts } from "@/types";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "./ui/drawer";
import Image from "next/image";

import Link from "next/link";
import { isMobileSafari } from "@/lib/utils";

type Props = {
  artifacts: Artifacts;
};

export function Builds({ artifacts }: Props) {
  return (
    <div className="flex flex-col justify-center items-center p-10">
      <h1 className="text-5xl">Builds</h1>
      <div className="flex flex-col lg:flex-row items-center gap-10">
        {artifacts.android && (
          <div className="flex flex-col items-center p-5">
            <h2 className="text-3xl mb-2">Android</h2>

            <Image
              width={300}
              height={300}
              src={artifacts.android.downloadQrCode}
              alt="Android QR Code"
            />

            <Button asChild variant="secondary" className="w-full mt-2">
              <Link href={artifacts.android.downloadUrl}>Download</Link>
            </Button>

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary" className="w-full mt-2">
                  Info
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Android Manifest</DrawerTitle>
                </DrawerHeader>

                <DrawerDescription>
                  <div className="overflow-auto max-h-[50vh]">
                    <pre>
                      {JSON.stringify(artifacts.android.metadata, null, 2)}
                    </pre>
                  </div>
                </DrawerDescription>

                <DrawerFooter>
                  <DrawerClose>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        )}
        {artifacts.ios && (
          <div className="flex flex-col items-center p-5">
            <h2 className="text-3xl mb-2">IOS</h2>

            <Image
              width={300}
              height={300}
              src={artifacts.ios.manifestQrCode}
              alt="Android QR Code"
            />

            <Button asChild variant="secondary" className="w-full mt-2">
              <Link
                href={
                  isMobileSafari()
                    ? artifacts.ios.manifestQrCodeUrl
                    : artifacts.ios.downloadUrl
                }
              >
                Download
              </Link>
            </Button>

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary" className="w-full mt-2">
                  Info
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>IOS Plist</DrawerTitle>
                </DrawerHeader>

                <DrawerDescription>
                  <div className="overflow-auto max-h-[50vh]">
                    <pre>{JSON.stringify(artifacts.ios.metadata, null, 2)}</pre>
                  </div>
                </DrawerDescription>

                <DrawerFooter>
                  <DrawerClose>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        )}
      </div>
    </div>
  );
}
