import { AutoResizeBuffer } from 'vgm-parser';
import { S98Object, S98TagObject, updateOffsets } from './s98_object';

function _writeS98Header(buf: AutoResizeBuffer, s98: S98Object): number {
  buf.setUint8(0x00, 0x53); // 'S'
  buf.setUint8(0x01, 0x39); // '9'
  buf.setUint8(0x02, 0x38); // '8'
  buf.setUint8(0x03, s98.version); // '3'
  buf.setUint32LE(0x04, s98.timerNumerator);
  buf.setUint32LE(0x08, s98.timerDenominator);
  buf.setUint32LE(0x0c, s98.compressing);
  buf.setUint32LE(0x10, s98.tagOffset);
  buf.setUint32LE(0x14, s98.dataOffset);
  buf.setUint32LE(0x18, s98.loopOffset);
  buf.setUint32LE(0x1c, s98.deviceCount);

  if (s98.deviceCount !== 0) {
    for (let i = 0; i < s98.devices.length; i++) {
      const device = s98.devices[i];
      buf.setUint32LE(0x20 + i * 16, device.type);
      buf.setUint32LE(0x24 + i * 16, device.clock);
      buf.setUint32LE(0x28 + i * 16, device.pan);
      buf.setUint32LE(0x2C + i * 16, 0); // RESERVED
    }
    return 0x20 + s98.devices.length * 16;
  }

  return 0x20;
}

function _writeS98Tag(buf: AutoResizeBuffer, byteOffset: number, tag: S98TagObject): number {
  let wp = byteOffset;
  wp += buf.setText(wp, `[S98]`);
  for (const key in ['title', 'artist', 'game', 'year', 'genere', 'comment', 's98by', 'system']) {
    if (tag[key] != null) {
      wp += buf.setText(wp, `${key}=${tag[key]}\n`);
    }
  }
  return wp;
}

export function buildS98(s98: S98Object): ArrayBuffer {
  const buf = new AutoResizeBuffer();
  updateOffsets(s98);
  let wp = _writeS98Header(buf, s98);
  buf.setData(wp, s98.data);
  wp += s98.data.byteLength;
  if (0 < Object.keys(s98.tag).length) {
    _writeS98Tag(buf, wp, s98.tag);
  }
  return buf.toArrayBuffer();
}