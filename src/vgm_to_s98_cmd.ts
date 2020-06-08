import { S98 } from "./index";
import * as fs from "fs";
import { convertVGMToS98 } from "./vgm_to_s98";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { VGM } from "vgm-parser";

const optionDefinitions = [
  {
    name: "input",
    alias: "i",
    typeLabel: "{underline file}",
    defaultOption: true,
    description: "Input VGM file. Standard input will be used if not specified."
  },
  {
    name: "output",
    alias: "o",
    typeLabel: "{underline file}",
    description:
      "Output S98 file. The standard output is used if not speicified.",
    type: String
  },
  {
    name: "parse-only",
    description: "Parse VGM data and show VGM header in JSON. No .s98 file is genereated.",
    type: Boolean
  },
  {
    name: "version",
    alias: "v",
    description: "Show version.",
    type: Boolean
  },
  {
    name: "help",
    alias: "h",
    description: "Show this help.",
    type: Boolean
  }
];

const sections = [
  {
    header: "vgm-to-s98",
    content: "VGM to S98 file converter"
  },
  {
    header: "SYNOPSIS",
    content: ["{underline vgm-to-s98} [<option>] <vgmfile>"]
  },
  {
    header: "OPTIONS",
    optionList: optionDefinitions
  },
];

function toArrayBuffer(b: Buffer) {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function main(argv: string[]) {
  const options = commandLineArgs(optionDefinitions, { argv });

  if (options.version) {
    const json = require("../package.json");
    console.info(json.version);
    return;
  }
  if (options.help) {
    console.error(commandLineUsage(sections));
    return;
  }

  if (process.platform === "win32") {
    if (options.input == null) {
      console.error("Please specify '--input' option. Standard input can not be used on Windows.");
      return;
    }
    if (options.output == null) {
      console.error("Please specify '--output' option. Standard output can not be used on Windows.");
      return;
    }
  }

  const input = options.input || "/dev/stdin";
  const output = options.output;

  try {
    const buf = fs.readFileSync(input);
    const vgm = VGM.parse(toArrayBuffer(buf));

    if (options['parse-only']) {
      console.info(JSON.stringify(vgm.toJSON(), (k, v) => {
        if (k === 'data') {
          return `(${v.byteLength} bytes)`;
        }
        return v;
      }, '  '));
      process.exit(0);
    }

    const s98 = convertVGMToS98(vgm);
    fs.writeFileSync(output, Buffer.from(s98.build()));

  } catch (e) {
    console.error(e);
  }
}

main(process.argv);
