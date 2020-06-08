import {
  S98Object,
  S98TagObject,
  S98DeviceObject,
} from "./s98_object";
import Encoding from "encoding-japanese";

const TextDecoder = require("util").TextDecoder; // for node.js: load TextDecoder.

function _parseS98TagObject(d: DataView, offset: number): S98TagObject {

  if (d.byteLength < offset + 8) {
    return {};
  }

  const id = String.fromCharCode(
    d.getUint8(offset),
    d.getUint8(offset + 1),
    d.getUint8(offset + 2),
    d.getUint8(offset + 3),
    d.getUint8(offset + 4),
  );

  if (id.toUpperCase() != '[S98]') {
    return {};
  }

  let index: number;
  let isUtf8: boolean;
  if (0xef == d.getUint8(offset + 5) && 0xbb == d.getUint8(offset + 6) && 0xbf == d.getUint8(offset + 7)) {
    index = offset + 8;
    isUtf8 = true;
  } else {
    index = offset + 5;
    isUtf8 = false;
  }

  const buf = [];
  while (index < d.byteLength) {
    const v = d.getUint8(index);
    if (v == 0x00) {
      break;
    }
    buf.push(v);
    index++;
  }

  const res = {};
  const encode = Encoding.detect(buf);
  const text = Encoding.convert(buf, { to: "UNICODE", from: encode, type: "string" }).toString();

  const lines = text.split(/\n/);
  lines.forEach((line) => {
    if (1 <= line.indexOf('=')) {
      const kv = line.split(/=/);
      (res as any)[kv[0]] = kv[1];
    }
  });

  return res;
}

function _parseS98DeviceObject(d: DataView, offset: number): S98DeviceObject {
  const type = d.getUint32(offset, true);
  const clock = d.getUint32(offset + 4, true);
  const pan = d.getUint32(offset + 8, true);
  return {
    type,
    clock,
    pan,
  };
}

export function parseS98(input: ArrayBuffer): S98Object {
  const d = new DataView(input);

  if (input.byteLength < 0x20) {
    throw new Error("Not a s98 file or version mismatch.");
  }

  const magic = String.fromCharCode(d.getUint8(0), d.getUint8(1), d.getUint8(2));
  if (magic != "S98") {
    throw new Error("Not a s98 file.");
  }
  const version = d.getUint8(3);
  const versionString = String.fromCharCode(version);
  if (versionString != '3') {
    throw new Error("Unsupported s98 version: ${versionString}.");
  }

  const timerNumerator = d.getUint32(0x04, true);
  const timerDenominator = d.getUint32(0x08, true);
  const compressing = d.getUint32(0x0c, true);
  const tagOffset = d.getUint32(0x10, true);
  const dataOffset = d.getUint32(0x14, true);
  const loopOffset = d.getUint32(0x18, true);
  const deviceCount = d.getUint32(0x1c, true);

  const tag = _parseS98TagObject(d, tagOffset);
  const data = new Uint8Array(input.slice(dataOffset));
  const devices = [];
  if (deviceCount == 0) {
    devices.push({
      type: 4,
      clock: 7987200,
      pan: 0,
    });
  } else {
    for (let i = 0; i < deviceCount; i++) {
      const device = _parseS98DeviceObject(d, 0x20 + 0x10 * i);
      devices.push(device);
    }
  }

  return {
    version,
    timerNumerator,
    timerDenominator,
    compressing,
    tagOffset,
    tag,
    dataOffset,
    data,
    loopOffset,
    deviceCount,
    devices,
  };
}