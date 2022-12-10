---
title   : Installation
anchors : true
---


# Installation

Install the mediasoup Node.js module via NPM within your Node.js application:

```bash
$ npm install mediasoup@2
```


## Requirements

In order to build the C/C++ component the following packages and libraries must be available in the target host:

* Node.js >= `v6.4.0`
* POSIX based operating system (Windows not supported)
* Python 2 (`python2` or `python` command must point to the Python 2 executable)
* `make`
* `gcc` and `g++` or `clang` (with C++11 support)
* `cc` command pointing to `gcc` or `clang`

<div markdown="1" class="note">
* In Debian and Ubuntu install the `build-essential` DEB package. It includes both `make` and `gcc`/`g++`.
* In YUM based Linux (Red Hat, CentOS) use `yum groupinstall "Development Tools"`.
* The installation path MUST NOT contain whitespaces.
</div>
