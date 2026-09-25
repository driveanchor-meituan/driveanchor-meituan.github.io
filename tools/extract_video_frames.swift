import AVFoundation
import CoreGraphics
import ImageIO
import Foundation

guard CommandLine.arguments.count == 3 else {
    fputs("usage: extract_video_frames <input.mp4> <output-directory>\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let asset = AVURLAsset(url: inputURL)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

let duration = try await asset.load(.duration)
let seconds = CMTimeGetSeconds(duration)
let count = 8
let margin = min(4.0, seconds / 20.0)
let times = (0..<count).map { index in
    let fraction = Double(index) / Double(count - 1)
    return CMTime(seconds: margin + fraction * max(0.0, seconds - 2.0 * margin), preferredTimescale: 600)
}

for (index, time) in times.enumerated() {
    let image = try generator.copyCGImage(at: time, actualTime: nil)
    let outputPath = outputURL.appendingPathComponent(String(format: "frame_%02d.jpg", index + 1))
    guard let destination = CGImageDestinationCreateWithURL(outputPath as CFURL, "public.jpeg" as CFString, 1, nil) else {
        throw NSError(domain: "FrameExport", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot create image destination"])
    }
    CGImageDestinationAddImage(destination, image, [kCGImageDestinationLossyCompressionQuality: 0.88] as CFDictionary)
    guard CGImageDestinationFinalize(destination) else {
        throw NSError(domain: "FrameExport", code: 2, userInfo: [NSLocalizedDescriptionKey: "Cannot finalize image"])
    }
    print("wrote \(outputPath.path)")
}
