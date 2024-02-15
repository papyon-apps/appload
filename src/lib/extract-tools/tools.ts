export class Tools {
  static toHex(plistBytes: Uint8Array): string {
    const list: Array<string> = [];
    plistBytes.forEach((byte) => {
      let s = byte.toString(16);
      if (s.length < 2) {
        s = "0" + s;
      }
      list.push(s);
    });

    return list.join("");
  }

  static toSimple(objInfo: number): boolean | null {
    switch (objInfo) {
      case 0x0:
        return null;
      case 0x8:
        return false;
      case 0x9:
        return true;
      case 0xf:
        return null;
      default:
        throw "Unhandled simple type 0x" + objInfo.toString(16);
    }
  }

  static toInt(plistBytes: Uint8Array, objInfo: number): number {
    const length = Math.pow(2, objInfo);
    const hex = Tools.toHex(plistBytes.slice(0, length));
    return parseInt(hex, 16);
  }

  static concatBytes(...values: Array<Uint8Array>): Uint8Array {
    const bytes: Array<number> = [];
    values.forEach((value) => {
      value.forEach((byte) => {
        bytes.push(byte);
      });
    });
    return new Uint8Array(bytes);
  }

  static longToBytes(num: number): Uint8Array {
    const byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

    for (let index = 0; index < byteArray.length; index++) {
      const byte = num & 0xff;
      byteArray[index] = byte;
      num = (num - byte) / 256;
    }
    return new Uint8Array(byteArray);
  }

  static intToBytes(num: number): Uint8Array {
    return new Uint8Array([
      (num & 0xff000000) >> 24,
      (num & 0x00ff0000) >> 16,
      (num & 0x0000ff00) >> 8,
      num & 0x000000ff,
    ]);
  }
}
