import { S98 } from "./index";
import { VGM, VGMDataStream, VGMWaitWordCommand, VGMWriteDataCommand, VGMEndCommand, createEmptyGD3TagObject, GD3TagObject } from "vgm-parser";
import { S98TagObject } from "./s98_object";

function _S98CommandToVGMCommand(s98: S98, s98cmd: number): number | undefined {
  const id = s98cmd >> 1;
  const ext = s98cmd & 1;
  const info = s98.devices[id];
  switch (info.type) {
    case 1: // YM2149
      return 0xa0;
    case 2: // YM2203
      return 0x55;
    case 3: // YM2612
      return 0x58 + ext;
    case 4: // YM2608
      return 0x56 + ext;
    case 5: // YM2151
      return 0x54 + ext;
    case 6: // YM2413
      return 0x51;
    case 7: // YM3526
      return 0x5b;
    case 8: // YM3812
      return 0x5a;
    case 15: // AY8910
      return 0xa0;
    case 16: // SN76489
      return 0x50;
    default:
      return undefined;
  }
}

function _buildChipType(s98: S98, vgm: VGM) {
  for (const d of s98.devices) {
    switch (d.type) {
      case 1:
        vgm.chips.ay8910 = { clock: d.clock / 2 };
        break;
      case 2:
        vgm.chips.ym2203 = { clock: d.clock };
        break;
      case 3:
        vgm.chips.ym2612 = { clock: d.clock };
        break;
      case 4:
        vgm.chips.ym2608 = { clock: d.clock };
        break;
      case 5:
        vgm.chips.ym2151 = { clock: d.clock };
        break;
      case 6:
        vgm.chips.ym2413 = { clock: d.clock };
        break;
      case 7:
        vgm.chips.ym3526 = { clock: d.clock };
        break;
      case 8:
        vgm.chips.ym3812 = { clock: d.clock };
        break;
      case 8:
        vgm.chips.ymf262 = { clock: d.clock };
        break;
      case 15:
        vgm.chips.ay8910 = { clock: d.clock };
        break;
      case 16:
        vgm.chips.sn76489 = { clock: d.clock };
        break;
      default:
        throw new Error(`Unsupported device type: ${d.type}`);
    }
  }
}

function _buildVGMDataStream(s98: S98): VGMDataStream {
  const stream = new VGMDataStream();
  const data = s98.data;
  let eod = false;
  let offset = 0;

  let timeBase = s98.timerNumerator / s98.timerDenominator;
  let timerRemainings = 0;

  const loopPoint = 0 < s98.loopOffset ? s98.loopOffset - s98.dataOffset : -1;
  while (!eod && offset < data.length) {
    if (offset == loopPoint) {
      stream.markLoopPoint();
    }
    const d = data[offset];
    switch (d) {
      case 0xff:
        {
          const count_f = (44100 * timeBase) + timerRemainings;
          const count = Math.floor(count_f);
          timerRemainings = count_f - count;
          stream.push(new VGMWaitWordCommand({ count }));
        }
        break;
      case 0xfe:
        offset++;
        let s = 0, n = 0;
        do {
          let p = data[offset];
          n |= (p & 0x7f) << s;
          s += 7;
          if (!(p & 0x80)) {
            break;
          }
        } while (offset < data.length);
        {
          const count_f = (44100 * n * timeBase) + timerRemainings;
          const count = Math.floor(count_f);
          timerRemainings = count_f - count;
          stream.push(new VGMWaitWordCommand({ count }));
        }
        break;
      case 0xfd:
        eod = true;
        stream.push(new VGMEndCommand());
        break;
      default:
        const cmd = _S98CommandToVGMCommand(s98, d);
        const aa = data[++offset];
        const dd = data[++offset];
        if (cmd != null) {
          stream.push(new VGMWriteDataCommand({ cmd: cmd, addr: aa, data: dd }));
        }
        break;
    }
    offset++;
  }

  return stream;
}

function _isJapanese(s: string | undefined) {
  if (s != null) {
    return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(s);
  }
  return false;
}

function _buildGD3TagObject(s98tag: S98TagObject): GD3TagObject {
  const gd3tag = createEmptyGD3TagObject();
  if (_isJapanese(s98tag.title)) {
    gd3tag.japanese.trackTitle = s98tag.title!
  } else {
    gd3tag.trackTitle = s98tag.title || '';
  }
  if (_isJapanese(s98tag.artist)) {
    gd3tag.japanese.composer = s98tag.artist!;
  } else {
    gd3tag.composer = s98tag.artist || '';
  }
  if (_isJapanese(s98tag.system)) {
    gd3tag.japanese.system = s98tag.system!;
  } else {
    gd3tag.system = s98tag.system || '';
  }
  if (_isJapanese(s98tag.game)) {
    gd3tag.japanese.gameName = s98tag.game!
  } else {
    gd3tag.gameName = s98tag.game || '';
  }

  gd3tag.notes = s98tag.comment || '';
  gd3tag.vgmBy = s98tag.s98by || ''
  return gd3tag;
}

export function convertS98ToVGM(s98: S98): VGM {
  const vgm = new VGM();
  _buildChipType(s98, vgm);
  const stream = _buildVGMDataStream(s98);
  vgm.setDataStream(stream);
  vgm.gd3tag = _buildGD3TagObject(s98.tag);
  return vgm;
}

