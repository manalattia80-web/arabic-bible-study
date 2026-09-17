#!/bin/bash
echo "Installing Flutter..."
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"
echo "Creating Web Support..."
flutter create . --platforms web
echo "Building Flutter Web..."
flutter config --enable-web
flutter build web --release
