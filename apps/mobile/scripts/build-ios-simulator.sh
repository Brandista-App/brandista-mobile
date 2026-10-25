#!/usr/bin/env bash
set -euo pipefail
[[ "$(uname -s)" == Darwin ]] || { echo 'macOS/Xcode is required'; exit 1; }
[[ ! -d ios ]] || { echo 'Existing native project found; inspect it instead of overwriting it.'; exit 1; }
out="$PWD/.expo/ios-final-artifact"
mkdir -p "$out"
git rev-parse HEAD > "$out/source-sha.txt"
xcodebuild -version > "$out/xcode-version.txt"
node --version > "$out/node-version.txt"
npx expo config --type public --json > "$out/expo-config.json"
npx expo prebuild --platform ios --no-install 2>&1 | tee "$out/prebuild.log"
cp ios/Podfile.properties.json "$out/Podfile.properties.json"
(cd ios && pod install) 2>&1 | tee "$out/pods.log"
xcodebuild -workspace ios/Brandista.xcworkspace -scheme Brandista \
  -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$PWD/.expo/ios-final-derived" -jobs 2 \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO \
  build 2>&1 | tee "$out/xcodebuild.log"
app="$PWD/.expo/ios-final-derived/Build/Products/Release-iphonesimulator/Brandista.app"
python3 scripts/verify-ios-simulator.py "$app" "$out"
ditto -c -k --sequesterRsrc --keepParent "$app" "$out/Brandista-Simulator.app.zip"
shasum -a 256 "$out/Brandista-Simulator.app.zip" > "$out/simulator-sha256.txt"
xcrun simctl list devices available -j > "$out/simulator-devices.json"
device=$(python3 - "$out/simulator-devices.json" <<'PY'
import json,sys
devices=[d for ds in json.load(open(sys.argv[1]))['devices'].values() for d in ds if d['isAvailable'] and d['name'].startswith('iPhone')]
assert devices,'No available iPhone Simulator'
print(devices[0]['udid'])
PY
)
echo "$device" > "$out/simulator-udid.txt"
xcrun simctl boot "$device"
xcrun simctl bootstatus "$device" -b
xcrun simctl install "$device" "$app"
xcrun simctl launch "$device" "$IOS_BUNDLE_IDENTIFIER" | tee "$out/simulator-launch.txt"
sleep 8
xcrun simctl io "$device" screenshot "$out/simulator-first-launch.png"
xcrun simctl terminate "$device" "$IOS_BUNDLE_IDENTIFIER"
xcrun simctl launch "$device" "$IOS_BUNDLE_IDENTIFIER" | tee "$out/simulator-relaunch.txt"
sleep 5
xcrun simctl io "$device" screenshot "$out/simulator-relaunch.png"
xcrun simctl shutdown "$device"
echo 'Simulator build/launch/relaunch completed. Screenshots require visual review; this is not physical-device acceptance.'
