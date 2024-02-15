import { Tools } from "./tools";

import * as PlistParser from "plist";
import * as Encoding from "text-encoding";

// EPOCH = new SimpleDateFormat("yyyy MM dd zzz").parse("2001 01 01 GMT").getTime();
// ...but that's annoying in a static initializer because it can throw exceptions, ick.
// So we just hardcode the correct value.
const EPOCH = 978307200000;
const utf8Decoder = new Encoding.TextDecoder("utf-8");
const ascDecoder = new Encoding.TextDecoder("ascii");
const utf16Decoder = new Encoding.TextDecoder("utf-16be");

const TYPE_SIMPLE = 0x0;
const TYPE_INTEGER = 0x1;
const TYPE_REAL = 0x2;
const TYPE_DATE = 0x3;
const TYPE_DATA = 0x4;
const TYPE_ASCII = 0x5;
const TYPE_UTF_16 = 0x6;
const TYPE_ARRAY = 0xa;
const TYPE_DICTIONARY = 0xd;
const TYPE_UID = 0x8;

let offsetTable: Array<number>;
let objectRefSize: number;

function parseObject(plistBytes: Uint8Array, offset: number): any {
  const type = plistBytes[offset];
  const objType = (type & 0xf0) >> 4;
  const objInfo = type & 0x0f;
  switch (objType) {
    case TYPE_SIMPLE:
      return Tools.toSimple(objInfo);
    case TYPE_INTEGER:
      return Tools.toInt(plistBytes.slice(offset + 1), objInfo);
    case TYPE_UID:
      return toUID(plistBytes.slice(offset + 1), objInfo);
    case TYPE_REAL:
      return toReal(plistBytes.slice(offset + 1), objInfo);
    case TYPE_DATE:
      return toDate(plistBytes.slice(offset + 1), objInfo);
    case TYPE_DATA:
      return toData(plistBytes.slice(offset + 1), objInfo);
    case TYPE_ASCII:
      return toString(plistBytes.slice(offset + 1), objInfo);
    case TYPE_UTF_16:
      return toString(plistBytes.slice(offset + 1), objInfo, true);
    case TYPE_ARRAY:
      return toArray(
        plistBytes.slice(offset + 1),
        objInfo,
        objectRefSize,
        plistBytes
      );
    case TYPE_DICTIONARY:
      return toDictionary(
        plistBytes.slice(offset + 1),
        objInfo,
        objectRefSize,
        plistBytes
      );
    default:
      throw "Unhandled type 0x" + objType.toString(16);
  }
}

function toUID(plistBytes: Uint8Array, objInfo: number): UID {
  const length = objInfo;
  return new UID(parseInt(Tools.toHex(plistBytes.slice(0, length)), 16));
}

function toReal(plistBytes: Uint8Array, objInfo: number): number {
  const length = Math.pow(2, objInfo);
  const dataView = new DataView(plistBytes.slice(0, length).buffer, 0);
  if (length === 4) {
    return dataView.getFloat32(0);
  } else {
    return dataView.getFloat64(0);
  }
}

function toDate(plistBytes: Uint8Array, objInfo: number): Date {
  if (objInfo != 0x3) {
    throw "error date";
  }
  const dataView = new DataView(plistBytes.slice(0, 8).buffer, 0);
  return new Date(EPOCH + 1000 * dataView.getFloat64(0));
}

function toData(plistBytes: Uint8Array, objInfo: number) {
  let length = objInfo;
  let dataOffset = 0;
  if (objInfo === 0xf) {
    const intType = (plistBytes[0] & 0xf0) >> 4;
    if (intType != 0x1) {
      console.error("0x4: UNEXPECTED LENGTH-INT TYPE! " + intType);
    }
    const intInfo = plistBytes[0] & 0x0f;
    const intLength = Math.pow(2, intInfo);
    length = parseInt(Tools.toHex(plistBytes.slice(1, 1 + intLength)), 16);
  }

  return plistBytes.slice(dataOffset, dataOffset + length);
}

function toString(
  plistBytes: Uint8Array,
  objInfo: number,
  isUTF16: boolean = false
): string {
  let length = objInfo;
  let stringOffset = 0;
  if (objInfo === 0xf) {
    const intType = (plistBytes[0] & 0xf0) >> 4;
    if (intType !== 0x1) {
      console.error("UNEXPECTED LENGTH-INT TYPE! " + intType);
    }
    const intInfo = plistBytes[0] & 0x0f;
    const intLength = Math.pow(2, intInfo);
    stringOffset = 1 + intLength;
    length = parseInt(Tools.toHex(plistBytes.slice(1, 1 + intLength)), 16);
  }

  length *= isUTF16 ? 2 : 1;
  const stringBytes = plistBytes.slice(stringOffset, stringOffset + length);
  if (isUTF16) {
    return utf16Decoder.decode(stringBytes);
  } else {
    return ascDecoder.decode(stringBytes);
  }
}

function toArray(
  plistBytes: Uint8Array,
  objInfo: number,
  objectRefSize: number,
  fullBytes: Uint8Array
) {
  let length = objInfo;
  let arrayOffset = 0;
  if (objInfo === 0xf) {
    const intType = (plistBytes[0] & 0xf0) >> 4;
    if (intType != 0x1) {
      console.error("0x4: UNEXPECTED LENGTH-INT TYPE! " + intType);
    }
    const intInfo = plistBytes[0] & 0x0f;
    const intLength = Math.pow(2, intInfo);
    arrayOffset = 1 + intLength;
    length = parseInt(Tools.toHex(plistBytes.slice(1, 1 + intLength)), 16);
  }

  const array = [];
  for (var i = 0; i < length; i++) {
    var objRef = parseInt(
      Tools.toHex(
        plistBytes.slice(
          arrayOffset + i * objectRefSize,
          arrayOffset + (i + 1) * objectRefSize
        )
      ),
      16
    );
    array.push(parseObject(fullBytes, offsetTable[objRef]));
  }
  return array;
}

function toDictionary(
  plistBytes: Uint8Array,
  objInfo: number,
  objectRefSize: number,
  fullBytes: Uint8Array
) {
  let length = objInfo;
  let dicOffset = 0;
  if (objInfo == 0xf) {
    const intType = (plistBytes[0] & 0xf0) >> 4;
    if (intType != 0x1) {
      console.error("0x4: UNEXPECTED LENGTH-INT TYPE! " + intType);
    }
    const intInfo = plistBytes[0] & 0x0f;
    const intLength = Math.pow(2, intInfo);
    dicOffset = 1 + intLength;
    length = parseInt(Tools.toHex(plistBytes.slice(1, 1 + intLength)), 16);
  }
  let dic: { [key in any]: any } = {};
  for (let i = 0; i < length; i++) {
    const keyRef = parseInt(
      Tools.toHex(
        plistBytes.slice(
          dicOffset + i * objectRefSize,
          dicOffset + (i + 1) * objectRefSize
        )
      ),
      16
    );
    const valRef = parseInt(
      Tools.toHex(
        plistBytes.slice(
          dicOffset + length * objectRefSize + i * objectRefSize,
          dicOffset + length * objectRefSize + (i + 1) * objectRefSize
        )
      ),
      16
    );
    const key = parseObject(fullBytes, offsetTable[keyRef]);
    const value = parseObject(fullBytes, offsetTable[valRef]);
    dic[key] = value;
  }
  return dic;
}

export function parsePlist(plistBytes: Uint8Array) {
  let header = utf8Decoder.decode(plistBytes.slice(0, "bplist".length));
  if (header !== "bplist") {
    return PlistParser.parse(utf8Decoder.decode(plistBytes));
  }

  // Handle trailer, last 32 bytes of the file
  const trailer = plistBytes.slice(plistBytes.length - 32);
  const offsetSize = trailer[6];
  objectRefSize = trailer[7];
  const objectCount = parseInt(Tools.toHex(trailer.slice(8, 16)), 16);
  const topObjectIndex = parseInt(Tools.toHex(trailer.slice(16, 24)), 16);
  const offsetTableOffset = parseInt(Tools.toHex(trailer.slice(24, 32)), 16);

  offsetTable = [];
  for (let i = 0; i < objectCount; i++) {
    const offset = Tools.toHex(
      plistBytes.slice(
        offsetTableOffset + i * offsetSize,
        offsetTableOffset + (i + 1) * offsetSize
      )
    );
    offsetTable.push(parseInt(offset, 16));
  }

  const info = parseObject(plistBytes, offsetTable[topObjectIndex]);
  return info;
}

class UID {
  id: number;

  constructor(id: number) {
    this.id = id;
  }
}
