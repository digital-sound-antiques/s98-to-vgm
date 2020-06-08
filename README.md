# s98-to-vgm
S98 to VGM file converter. VGM to S98 conversion is also possible. 

- YM2612 DAC is not supported yet.
- YM2608 ADPCM is not mapped to VGM data-block. The ADPCM part can be played limited players (ex. node-spfm). 

# Install

```
$ npm install s98-to-vgm
```

# S98 to VGM 
```
$ s98-to-vgm -o output.vgm input.s98
```

# VGM to S98
```
$ vgm-to-s98 -o output.s98 input.vgm
```

# Usage
```
$ vgm-to-s98 --help

vgm-to-s98

  VGM to S98 file converter 

SYNOPSIS

  vgm-to-s98 [<option>] <vgmfile> 

OPTIONS

  -i, --input file    Input VGM file. Standard input will be used if not specified.           
  -o, --output file   Output S98 file. The standard output is used if not speicified.         
  --parse-only        Parse VGM data and show VGM header in JSON. No .s98 file is genereated. 
  -v, --version       Show version.                                                           
  -h, --help          Show this help.   
```

```
$ s98-to-vgm --help

s98-to-vgm

  S98 to VGM file converter 

SYNOPSIS

  s98-to-vgm [<option>] <s98file> 

OPTIONS

  -i, --input file    Input S98 file. Standard input will be used if not specified.                 
  -o, --output file   Output VGM file. The standard output is used if not speicified. If the given  
                      file is *.vgz, the output will be compressed.                                 
  --parse-only        Parse S98 data and show S98 header in JSON. No .vgm file is genereated.       
  -v, --version       Show version.                                                                 
  -h, --help          Show this help.  
```
