export type S98TagObject = { [key: string]: string } & {
  title?: string;
  artist?: string;
  game?: string;
  year?: string;
  genere?: string;
  comment?: string;
  copyright?: string;
  s98by?: string;
  system?: string;
};

export type S98DeviceType = number;

function getS98DeviceName(type: S98DeviceType): string {
  switch (type) {
    case 1: return 'ym2149';
    case 2: return 'ym2203';
    case 3: return 'ym2612';
    case 4: return 'ym2608';
    case 5: return 'ym2151';
    case 6: return 'ym2413';
    case 7: return 'ym3526';
    case 8: return 'ym3812';
    case 9: return 'ymf262';
    case 15: return 'ay-3-8910';
    case 16: return 'sn76489';
    default: return 'none';
  }
}

export type S98DeviceObject = {
  type: S98DeviceType;
  clock: number;
  pan: number;
};

export type S98Object = {
  version: number;
  timerNumerator: number;
  timerDenominator: number;
  compressing: number; // always 0
  tagOffset: number;
  tag: S98TagObject;
  dataOffset: number;
  data: Uint8Array;
  loopOffset: number; // relative from file top
  relativeLoopOffset: number; // relative from data top.
  deviceCount: number;
  devices: S98DeviceObject[];
}

export function deepCloneS98TagObject(arg: S98TagObject): S98TagObject {
  return { ...arg };
}

export function deepCloneS98DeviceObject(arg: S98DeviceObject): S98DeviceObject {
  return { ...arg };
}

export function deepCloneS98DeviceList(list: S98DeviceObject[]) {
  return list.map((obj) => deepCloneS98DeviceObject(obj));
}

export function deepCloneS98Object(arg: S98Object): S98Object {
  return {
    ...arg,
    tagOffset: arg.tagOffset,
    tag: deepCloneS98TagObject(arg.tag),
    dataOffset: arg.dataOffset,
    data: arg.data.slice(0),
    loopOffset: arg.loopOffset,
    relativeLoopOffset: arg.relativeLoopOffset,
    deviceCount: arg.deviceCount,
    devices: deepCloneS98DeviceList(arg.devices)
  };
}

export function createEmptyS98Object(): S98Object {
  return {
    version: "3".charCodeAt(0),
    timerNumerator: 10,
    timerDenominator: 1000,
    compressing: 0,
    tagOffset: 0,
    tag: {},
    dataOffset: 0,
    data: new Uint8Array(),
    loopOffset: 0,
    relativeLoopOffset: -1,
    deviceCount: 0,
    devices: [],
  };
}

export function updateOffsets(s98: S98Object): void {
  s98.version = 0x33; // '3';
  s98.dataOffset = 0x20 + s98.deviceCount * 16;
  if (0 <= s98.relativeLoopOffset) {
    s98.loopOffset = s98.dataOffset + s98.relativeLoopOffset;
  } else {
    s98.loopOffset = 0;
  }
  s98.tagOffset = s98.dataOffset + s98.data.byteLength;
}
