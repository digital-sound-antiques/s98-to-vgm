import {
  S98Object,
  deepCloneS98Object,
  S98TagObject,
  createEmptyS98Object,
  S98DeviceObject,
} from "./s98_object";
import { parseS98 } from "./s98_parser";

export class S98 {
  private _obj: S98Object;

  get timerNumerator(): number {
    return this._obj.timerNumerator;
  }

  get timerDenominator(): number {
    return this._obj.timerDenominator;
  }

  get version(): number {
    return this._obj.version;
  }
  get dataOffset(): number {
    return this._obj.dataOffset;
  }
  get loopOffset(): number {
    return this._obj.dataOffset;
  }
  get tag(): S98TagObject {
    return this._obj.tag;
  }
  get data(): Uint8Array {
    return this._obj.data;
  }
  get devices(): Array<S98DeviceObject> {
    return this._obj.devices;
  }

  constructor(arg?: S98Object | null) {
    if (arg) {
      this._obj = deepCloneS98Object(arg);
    } else {
      this._obj = createEmptyS98Object();
    }
  }

  /** Convert VGM instance to pure [S98Object]. */
  toObject(): S98Object {
    return deepCloneS98Object(this._obj);
  }

  /** deep clone this instance. */
  clone(): S98 {
    return new S98(deepCloneS98Object(this._obj));
  }

  /**
   * parse S98 binary and return S98 instance.
   * @param data ArrayBuffer which contains S98 binary.
   */
  static parse(data: ArrayBuffer): S98 {
    return new S98(parseS98(data));
  }
}