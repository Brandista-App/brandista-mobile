"""Check bundled original imagery (Android may losslessly crunch PNG bytes)."""
import hashlib
import base64
import json
from pathlib import Path
import subprocess
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as apk:
    images = {n: apk.read(n) for n in apk.namelist() if n.startswith(('assets/', 'res/')) and n.endswith('.png')}
    packaged = {hashlib.sha256(data).hexdigest() for data in images.values()}
    originals = list(Path('assets/showcase').glob('*.png'))
    missing = []
    for asset in originals:
        original = asset.read_bytes()
        if hashlib.sha256(original).hexdigest() not in packaged:
            missing.append(asset)
    if missing:
        # aapt2 may rename and losslessly crunch resources. Compare decoded RGBA
        # pixels with the already locked Expo image tooling, not resource names.
        dimensions = {asset.read_bytes()[16:24] for asset in missing}
        candidates = {name: data for name, data in images.items() if data[:8] == b'\x89PNG\r\n\x1a\n' and data[16:24] in dimensions}
        payload = {
            'originals': {str(asset): base64.b64encode(asset.read_bytes()).decode() for asset in missing},
            'packaged': {name: base64.b64encode(data).decode() for name, data in candidates.items()},
        }
        subprocess.run(['node', 'scripts/verify-showcase-pixels.cjs'], input=json.dumps(payload), text=True, check=True)
    assert len(originals) >= 3
    bundle = apk.read('assets/index.android.bundle')
    for marker in [b'OFFLINE SHOWCASE', b'SIMULATED ORDER CONFIRMATION', b'Mehr Atelier', b'brandista.showcase.cart.v1']:
        assert marker in bundle or marker.decode('ascii').encode('utf-16-le') in bundle, f'Missing showcase bundle marker: {marker}'
print('Verified original bundled catalogue imagery and showcase JavaScript markers')
