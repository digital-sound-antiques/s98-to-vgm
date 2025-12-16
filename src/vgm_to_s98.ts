import {
  VGM,
  VGMWaitCommand,
  VGMWrite2ACommand,
  VGMWriteDataCommand,
  VGMEndCommand,
  AutoResizeBuffer,
  VGMDataBlockCommand,
  VGMSeekPCMCommand
} from 'vgm-parser';
import { S98DeviceObject } from './s98_object';
import { S98 } from './s98';

type DeviceInfo = (S98DeviceObject & { id: number });

type DeviceMap = {
  ay8910?: DeviceInfo;
  ym2203?: DeviceInfo;
  ym2612?: DeviceInfo;
  ym2608?: DeviceInfo;
  ym2151?: DeviceInfo;
  ym2413?: DeviceInfo;
  ym3526?: DeviceInfo;
  ym3812?: DeviceInfo;
  sn76489?: DeviceInfo;
}

function _enumerateDevices(vgm: VGM): DeviceMap {
  const res: DeviceMap = {};
  let id: number = 0;
  if (vgm.chips.ay8910) {
    if (vgm.chips.ay8910.chipType && vgm.chips.ay8910.chipType.name == 'ay8910') {
      res.ay8910 = { id, type: 15, clock: vgm.chips.ay8910.clock * 2, pan: 0 };
    } else {
      res.ay8910 = { id, type: 1, clock: vgm.chips.ay8910.clock * 2, pan: 0 };
    }
    id += 2;
  }
  if (vgm.chips.ym2203) {
    res.ym2203 = { id, type: 2, clock: vgm.chips.ym2203.clock, pan: 0 };
    id += 2;
  }
  if (vgm.chips.ym2612) {
    res.ym2612 = { id, type: 3, clock: vgm.chips.ym2612.clock, pan: 0 };
    id += 2;
  }
  if (vgm.chips.ym2608) {
    res.ym2608 = { id, type: 4, clock: vgm.chips.ym2608.clock, pan: 0 };
    id += 2;
  }
  if (vgm.chips.ym2151) {
    res.ym2151 = { id, type: 5, clock: vgm.chips.ym2151.clock, pan: 0 };
    id += 2;
  }
  if (vgm.chips.ym2413) {
    res.ym2413 = { id, type: 6, clock: vgm.chips.ym2413.clock, pan: 0 };
    id += 2;
  }
  if (vgm.chips.ym3526) {
    res.ym3526 = { id, type: 7, clock: vgm.chips.ym3526.clock, pan: 0 };
    id += 2;
  }
  if (vgm.chips.ym3812) {
    res.ym3812 = { id, type: 8, clock: vgm.chips.ym3812.clock, pan: 0 };
    id += 2;
  }
  if (vgm.chips.sn76489) {
    res.sn76489 = { id, type: 16, clock: vgm.chips.sn76489.clock, pan: 0 };
    id += 2;
  }
  return res;
}

function _VGMCommandToS98Command(deviceMap: DeviceMap, cmd: number): number | undefined {
  switch (cmd) {
    case 0xa0: // AY8910
      return deviceMap.ay8910?.id;
    case 0x55:
      return deviceMap.ym2203?.id;
    case 0x58:
    case 0x59:
      return deviceMap.ym2612?.id;
    case 0x56:
    case 0x57:
      return deviceMap.ym2608?.id;
    case 0x54:
      return deviceMap.ym2151?.id;
    case 0x51:
      return deviceMap.ym2413?.id;
    case 0x5b:
      return deviceMap.ym3526?.id;
    case 0x5a:
      return deviceMap.ym3812?.id;
    case 0x50:
      return deviceMap.sn76489?.id;
    default:
      return undefined;
  }
}

function _writeLength(buf: AutoResizeBuffer, offset: number, count: number): number {
  let wp = offset;
  let c = count;
  while (c >= 0x80) {
    buf.setUint8(wp++, 0x80 | (c & 0x7f));
    c >>= 7;
  }
  buf.setUint8(wp++, c);
  return wp - offset;
}

export function convertVGMToS98(vgm: VGM): S98 {
  const s98 = new S98();
  const deviceMap = _enumerateDevices(vgm);
  const devices = Object.values(deviceMap).sort((a, b) => a!.id - b!.id);
  s98.devices = devices as S98DeviceObject[];
  s98.timerNumerator = 1;
  s98.timerDenominator = 44100;

  const buf = new AutoResizeBuffer();

  const stream = vgm.getDataStream();
  let wp = 0;
  let loopOffset = -1;
  let ym2612_pcm_data = new Uint8Array();
  let ym2612_pcm_offset = 0;
  for (let i = 0; i < stream.commands.length; i++) {
    if (0 < stream.loopSamples && stream.loopIndexOffset <= i && loopOffset < 0) {
      loopOffset = wp;
    }
    const cmd = stream.commands[i];
    if (cmd instanceof VGMWaitCommand) {
      let c = cmd.count;
      if (c === 1) {
        buf.setUint8(wp++, 0xff); // 1SYNC
      } else if (c > 1) {
        buf.setUint8(wp++, 0xfe); // nSYNC
        wp += _writeLength(buf, wp, c - 2);
      }
    } else if (cmd instanceof VGMWriteDataCommand) {
      const id = _VGMCommandToS98Command(deviceMap, cmd.cmd);
      if (id != null) {
        buf.setUint8(wp++, id + cmd.port);
        buf.setUint8(wp++, cmd.addr);
        buf.setUint8(wp++, cmd.data);
      }
    } else if (cmd instanceof VGMWrite2ACommand) {
      if (deviceMap.ym2612) {
        buf.setUint8(wp++, deviceMap.ym2612.id);
        buf.setUint8(wp++, 0x2a);
        if (ym2612_pcm_offset < ym2612_pcm_data.length) {
          buf.setUint8(wp++, ym2612_pcm_data[ym2612_pcm_offset++]);
        } else {
          buf.setUint8(wp++, 0);
        }
        let c = cmd.count;
        if (c === 1) {
          buf.setUint8(wp++, 0xff); // 1SYNC
        } else if (c > 1) {
          buf.setUint8(wp++, 0xfe); // nSYNC
          wp += _writeLength(buf, wp, c - 2);
        }
      }
    } else if (cmd instanceof VGMDataBlockCommand) {
      switch (cmd.blockType) {
        case 0x00:
          ym2612_pcm_data = cmd.blockData;
          break;
        case 0x81: // YM2608
          break;
      }
    } else if (cmd instanceof VGMSeekPCMCommand) {
      ym2612_pcm_offset = cmd.offset;
    } else if (cmd instanceof VGMEndCommand) {
      buf.setUint8(wp++, 0xfd);
      break;
    }
  }

  s98.setData(new Uint8Array(buf.toArrayBuffer()), loopOffset);
  return s98;
}
