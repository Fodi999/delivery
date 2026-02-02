#!/bin/bash

# Simple icon generation script using ImageMagick
# If ImageMagick is not installed, we'll create a simple placeholder

# Check if convert (ImageMagick) is available
if command -v convert &> /dev/null; then
    echo "Generating PNG icons from SVG..."
    convert -background none -resize 192x192 public/icon.svg public/icon-192x192.png
    convert -background none -resize 256x256 public/icon.svg public/icon-256x256.png
    convert -background none -resize 384x384 public/icon.svg public/icon-384x384.png
    convert -background none -resize 512x512 public/icon.svg public/icon-512x512.png
    echo "✅ Icons generated successfully"
else
    echo "⚠️  ImageMagick not found. Please install it or generate icons manually."
    echo "You can use online tools like:"
    echo "  - https://realfavicongenerator.net"
    echo "  - https://favicon.io"
    echo ""
    echo "Or install ImageMagick:"
    echo "  brew install imagemagick"
fi
