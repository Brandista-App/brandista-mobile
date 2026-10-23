"""Check bundled original imagery (Android may losslessly crunch PNG bytes)."""
import hashlib
from pathlib import Path
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as apk:
    images = {n: apk.read(n) for n in apk.namelist() if n.startswith(('assets/', 'res/')) and n.endswith('.png')}
    packaged = {hashlib.sha256(data).hexdigest() for data in images.values()}
    for asset in Path('assets/showcase').glob('*.png'):
        original = asset.read_bytes()
        matching_resource = [data for name, data in images.items() if f'showcase_{asset.stem}.png' in name]
        assert hashlib.sha256(original).hexdigest() in packaged or any(
            data[:8] == original[:8] and data[16:24] == original[16:24] and len(data) > 50000
            for data in matching_resource
        ), f'Missing bundled image or invalid dimensions: {asset}'
    assert len(list(Path('assets/showcase').glob('*.png'))) >= 3
    bundle = apk.read('assets/index.android.bundle')
    for marker in [b'OFFLINE SHOWCASE', b'SIMULATED ORDER CONFIRMATION', b'Mehr Atelier', b'brandista.showcase.cart.v1']:
        assert marker in bundle, f'Missing showcase bundle marker: {marker}'
print('Verified original bundled catalogue imagery and showcase JavaScript markers')
