"""Fail closed on missing, mismatched or incorrectly compiled ARM native libraries."""
import json
from pathlib import Path
import struct
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as apk:
    libraries = {}
    for name in apk.namelist():
        if name.startswith('lib/') and name.endswith('.so'):
            _, abi, library = name.split('/')
            expected = {'armeabi-v7a': (1, 40), 'arm64-v8a': (2, 183)}[abi]
            data = apk.read(name)
            assert data[:4] == b'\x7fELF' and data[5] == 1, name
            assert (data[4], struct.unpack_from('<H', data, 18)[0]) == expected, name
            libraries.setdefault(abi, []).append(library)
    assert set(libraries) == {'armeabi-v7a', 'arm64-v8a'}, libraries
    assert set(libraries['armeabi-v7a']) == set(libraries['arm64-v8a']), libraries
    assert {'libreactnative.so', 'libhermesvm.so', 'libexpo-modules-core.so'} <= set(libraries['armeabi-v7a'])
    assert len(apk.read('assets/index.android.bundle')) > 100000
Path('native-libraries.json').write_text(json.dumps(libraries, indent=2))
print('Verified bundled JavaScript and matching ELF native libraries for both ARM ABIs')
