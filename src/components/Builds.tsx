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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { DiAndroid, DiApple } from "react-icons/di";
import { HiOutlineDownload, HiOutlineInformationCircle } from "react-icons/hi";
import { headers } from "next/headers";

type Props = {
  artifacts: Artifacts;
};

const humanReadableSize = (size: number) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    +(size / Math.pow(1024, i)).toFixed(2) + " " + ["B", "kB", "MB", "GB"][i]
  );
};

export function Builds({ artifacts }: Props) {
  const headerLists = headers();
  const isMobileSafari =
    headerLists.get("user-agent")?.match(/(iPod|iPhone|iPad)/) &&
    headerLists.get("user-agent")?.match(/AppleWebKit/);

  return (
    <div className="flex flex-col justify-center items-center p-10">
      <h1 className="text-5xl">Builds </h1>

      <div className="flex flex-col lg:flex-row items-center gap-10 mt-10">
        {artifacts.android && (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-row justify-center items-center">
                <DiAndroid color="white" size={26} className="mr-2" />
                <span>Android</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                width={300}
                height={300}
                src={artifacts.android.downloadQrCode}
                alt="Android QR Code"
              />
              <p className="text-center text-gray-500 mt-2">
                <span className="font-bold">Upload Date: </span>
                {new Date(artifacts.android.uploadDate).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex-col">
              <Button asChild variant="secondary" className="w-full mt-2">
                <Link href={artifacts.android.downloadUrl}>
                  <HiOutlineDownload className="mr-2" size={24} />
                  Download
                  <span className="ml-1 text-gray-400">
                    ({humanReadableSize(artifacts.android.size)})
                  </span>
                </Link>
              </Button>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="secondary" className="w-full mt-2">
                    <HiOutlineInformationCircle className="mr-2" size={24} />
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
            </CardFooter>
          </Card>
        )}
        {artifacts.ios && (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-row justify-center items-center">
                <DiApple color="white" size={26} className="mr-2" />
                <span>IOS</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                width={300}
                height={300}
                src={artifacts.ios.manifestQrCode}
                alt="Android QR Code"
              />
              <p className="text-center text-gray-500 mt-2">
                <span className="font-bold">Upload Date: </span>
                {new Date(artifacts.ios.uploadDate).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex-col">
              <Button asChild variant="secondary" className="w-full mt-2">
                <Link
                  href={
                    isMobileSafari
                      ? artifacts.ios.manifestQrCodeUrl
                      : artifacts.ios.downloadUrl
                  }
                >
                  <HiOutlineDownload className="mr-2" size={24} />
                  {isMobileSafari ? "Install" : "Download"}
                  <span className="ml-1 text-gray-400">
                    ({humanReadableSize(artifacts.ios.size)})
                  </span>
                </Link>
              </Button>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="secondary" className="w-full mt-2">
                    <HiOutlineInformationCircle className="mr-2" size={24} />
                    Info
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>IOS Plist</DrawerTitle>
                  </DrawerHeader>

                  <DrawerDescription>
                    <div className="overflow-auto max-h-[50vh]">
                      <pre>
                        {JSON.stringify(artifacts.ios.metadata, null, 2)}
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
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
