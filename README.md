# s98-to-vgm

S98 to VGM file converter.

# Install
```
$ npm install s98-to-vgm
```

# Quick Usage
```
$ s98-to-vgm -o output.vgm ~/Download/sample.s98
```

To compress the output, simply specify extension to .vgz.
```
$ s98-to-vgm -o output.vgz ~/Download/sample.s98
```

# Usage

```
  S98 to VGM file converter 

SYNOPSIS

  s98-to-vgm [<option>] <s98file> 

OPTIONS

  -i, --input file    Specify S98 file. Standard input will be used if not specified.                 
  -o, --output file   Specify output VGM file. The standard output is used if not speicified. If the given  
                      file is *.vgz, the output will be compressed.                                 
  --parse-only        Parse S98 data and show S98 header in JSON. No vgm file is genereated.       
  -v, --version       Show version.                                                                 
  -h, --help          Show this help.    
```

