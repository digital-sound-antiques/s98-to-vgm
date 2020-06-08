import { S98 } from "./index";
import * as fs from "fs";
import { convertS98ToVGM } from "./s98_to_vgm";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

const optionDefinitions = [
  {
    name: "input",
    alias: "i",
    typeLabel: "{underline file}",
    defaultOption: true,
    description: "Input S98 file. Standard input will be used if not specified."
  },
  {
    name: "output",
    alias: "o",
    typeLabel: "{underline file}",
    description:
      "Output VGM file. The standard output is used if not speicified. If the given file is *.vgz, the output will be compressed.",
    type: String
  },
  {
    name: "parse-only",
    description: "Parse S98 data and show S98 header in JSON. No .vgm file is genereated.",
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
    header: "s98-to-vgm",
    content: "S98 to VGM file converter"
  },
  {
    header: "SYNOPSIS",
    content: ["{underline s98-to-vgm} [<option>] <s98file>"]
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
  const output = options.output || "/dev/stdout";

  try {
    const buf = fs.readFileSync(input);
    const s98 = S98.parse(toArrayBuffer(buf));

    if (options['parse-only']) {
      console.info(s98.toJSON());
      process.exit(0);
    }

    const vgm = convertS98ToVGM(s98);
    const compress = /\.vgz/i.test(output);
    fs.writeFileSync(output, Buffer.from(vgm.build({ compress })));

  } catch (e) {
    console.error(e);
  }
}

main(process.argv);
