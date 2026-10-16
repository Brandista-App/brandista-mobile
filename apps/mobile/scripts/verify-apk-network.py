"""Verify the policy referenced by the APK manifest, including optimized resource paths."""
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlparse
import zipfile

apk = sys.argv[1]
aapt = str(Path(os.environ['ANDROID_HOME']) / 'build-tools/37.0.0/aapt')
def dump(*args):
    return subprocess.check_output([aapt, 'dump', *args], text=True)

manifest = dump('xmltree', apk, 'AndroidManifest.xml')
if os.environ.get('BACKEND_MODE') != 'internal-lan':
    assert 'networkSecurityConfig' not in manifest, 'LAN policy must not enter production'
    Path('network-security.txt').write_text('Production HTTPS mode; no LAN policy\n')
    sys.exit(0)

match = re.search(r'networkSecurityConfig[^\n]*?@(0x[0-9a-fA-F]+)', manifest)
assert match, 'Manifest has no network security config reference'
resource_id = match.group(1).lower()
resources = dump('resources', apk)
with zipfile.ZipFile(apk) as archive:
    entries = set(archive.namelist())
    candidates = set()
    current_id = None
    for line in resources.splitlines():
        resource = re.search(r'\bresource (0x[0-9a-fA-F]+)\b', line)
        if resource:
            current_id = resource.group(1).lower()
        if current_id == resource_id:
            for value in re.findall(r'res/[^\s"\)]+', line):
                if value in entries:
                    candidates.add(value)
    assert len(candidates) == 1, f'Cannot resolve manifest resource {resource_id}: {candidates}'
    resource_path = candidates.pop()

policy = dump('xmltree', apk, resource_path)
host = urlparse(os.environ['EXPO_PUBLIC_API_BASE_URL']).hostname
assert 'E: network-security-config' in policy
assert re.search(r'E: base-config[^\n]*\n\s*A: cleartextTrafficPermitted[^\n]*0x0\b', policy), policy
assert re.search(r'E: domain-config[^\n]*\n\s*A: cleartextTrafficPermitted[^\n]*0xffffffff\b', policy), policy
assert len(re.findall(r'E: domain \(', policy)) == 1, policy
assert re.search(r'includeSubdomains[^\n]*0x0\b', policy), policy
assert f'"{host}"' in policy, policy
Path('network-security.txt').write_text(f'Manifest policy: {resource_id} -> {resource_path}\n' + policy)
print(f'Verified manifest-referenced LAN policy: {host}; all other cleartext denied')
