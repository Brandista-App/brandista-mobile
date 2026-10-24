"""Validate a CNG Release Simulator app; never labels it an installable iPhone IPA."""
import hashlib
import json
from pathlib import Path
import plistlib
import subprocess
import sys

app, out = map(Path, sys.argv[1:])
info = plistlib.loads((app / 'Info.plist').read_bytes())
assert info['CFBundleSupportedPlatforms'] == ['iPhoneSimulator'], info
assert info['CFBundleIdentifier'] == 'invalid.example.brandista.simulator'
assert not (app / 'embedded.mobileprovision').exists(), 'Unexpected device provisioning material'
ats = info.get('NSAppTransportSecurity', {})
assert not ats.get('NSAllowsArbitraryLoads', False), ats
bundle = app / 'main.jsbundle'
assert bundle.is_file() and bundle.stat().st_size > 100_000, 'Missing standalone JS bundle'
assert bundle.read_bytes()[:8].hex() == 'c61fbc03c103191f', 'Expected Hermes bytecode'
for text in [b'OFFLINE SHOWCASE', b'SIMULATED ORDER CONFIRMATION']:
    assert text in bundle.read_bytes(), f'Missing offline catalogue marker {text!r}'
binary = app / info['CFBundleExecutable']
build = subprocess.check_output(['xcrun', 'vtool', '-show-build', str(binary)], text=True)
assert 'IOSSIMULATOR' in build, build
(out / 'mach-o-build.txt').write_text(build)
source_logo = Path('../brand-assets/brandista-approved-logo.jpeg.jpeg')
logo_hash = hashlib.sha256(source_logo.read_bytes()).hexdigest()
assert logo_hash == '8ef9793e563c0f5cc28e508bb359c85fc53f5cba6d471eea7d4d926c38d5bfae'
images = [p for p in app.rglob('*') if p.suffix.lower() in {'.jpeg', '.jpg', '.png'}]
assert any(hashlib.sha256(p.read_bytes()).hexdigest() == logo_hash for p in images), 'Original runtime logo missing'
assert len(images) >= 4, 'Bundled catalogue imagery missing'
(out / 'app-verification.json').write_text(json.dumps({
    'platform': info['CFBundleSupportedPlatforms'], 'identifier': info['CFBundleIdentifier'],
    'minimumOS': info['MinimumOSVersion'], 'hermesBytes': bundle.stat().st_size,
    'bundledImageFiles': len(images), 'originalLogoSha256': logo_hash,
    'ats': ats, 'artifactKind': 'Simulator .app; NOT an iPhone IPA',
    'usageDescriptions': {k: v for k, v in info.items() if k.endswith('UsageDescription')},
}, indent=2))
print('Verified standalone Hermes Simulator app, original logo, imagery and transport policy')
