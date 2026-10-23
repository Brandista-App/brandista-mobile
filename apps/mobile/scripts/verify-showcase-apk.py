"""Check exact bundled original showcase imagery, rather than network/cache availability."""
import hashlib
from pathlib import Path
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as apk:
    packaged = {hashlib.sha256(apk.read(n)).hexdigest() for n in apk.namelist() if n.startswith('assets/') and n.endswith('.png')}
    for asset in Path('assets/showcase').glob('*.png'):
        assert hashlib.sha256(asset.read_bytes()).hexdigest() in packaged, f'Missing bundled asset: {asset}'
    assert len(list(Path('assets/showcase').glob('*.png'))) >= 3
    bundle = apk.read('assets/index.android.bundle')
    for marker in [b'OFFLINE SHOWCASE', b'SIMULATED ORDER CONFIRMATION', b'Mehr Atelier', b'brandista.showcase.cart.v1']:
        assert marker in bundle, f'Missing showcase bundle marker: {marker}'
print('Verified original bundled catalogue imagery and showcase JavaScript markers')
