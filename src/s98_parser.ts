import {
  S98Object,
  S98TagObject,
  S98DeviceObject,
} from "./s98_object";
import Encoding from "encoding-japanese";

function _parseS98SongName(d: DataView, offset: number): S98TagObject {
  if (offset === 0) {
    return {};
  }
  const buf = [];
  let index = offset;
  while (index < d.byteLength) {
    const v = d.getUint8(index);
    if (v == 0x00) {
      break;
    }
    buf.push(v);
    index++;
  }
  const title = Encoding.convert(buf, { to: "UNICODE", from: "SJIS", type: "string" }).toString();
  return { title };
}

function _parseS98TagObject(d: DataView, offset: number): S98TagObject {
  if (offset === 0) {
    return {};
  }

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
  const versionCode = version - 0x30;
  if (versionCode < 0 || 3 < versionCode) {
    throw new Error(`Unsupported s98 version: '${versionCode}'.`);
  }

  const timerNumerator = d.getUint32(0x04, true) || 10;
  const timerDenominator = d.getUint32(0x08, true) || 1000;
  const compressing = d.getUint32(0x0c, true);
  const tagOffset = d.getUint32(0x10, true);
  const dataOffset = d.getUint32(0x14, true);
  const loopOffset = d.getUint32(0x18, true);
  const relativeLoopOffset = 0 < loopOffset ? (loopOffset - dataOffset) : -1;
  const deviceCount = 3 <= versionCode ? d.getUint32(0x1c, true) : 0;

  const tag = versionCode < 3 ? _parseS98SongName(d, tagOffset) : _parseS98TagObject(d, tagOffset);
  const data = new Uint8Array(input.slice(dataOffset));
  const devices = [];
  const maxDevices = versionCode < 3 ? 64 : Math.min(deviceCount, 64);
  for (let i = 0; i < maxDevices; i++) {
    const device = _parseS98DeviceObject(d, 0x20 + 0x10 * i);
    if (device.type === 0) {
      break;
    }
    devices.push(device);
  }
  if (devices.length === 0) {
    devices.push({
      type: 4,
      clock: 7987200,
      pan: 0,
    });
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
    relativeLoopOffset,
    deviceCount,
    devices,
  };
}