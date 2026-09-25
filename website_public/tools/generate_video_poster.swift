import AVFoundation
import CoreGraphics
import ImageIO
import Foundation

guard CommandLine.arguments.count == 4,
      let seconds = Double(CommandLine.arguments[3]) else {
    fputs("usage: generate_video_poster <input.mp4> <output.jpg> <seconds>\n", stderr)
    exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let asset = AVURLAsset(url: inputURL)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = CMTime(seconds: 1, preferredTimescale: 600)
generator.requestedTimeToleranceAfter = CMTime(seconds: 1, preferredTimescale: 600)

let image = try generator.copyCGImage(
    at: CMTime(seconds: seconds, preferredTimescale: 600),
    actualTime: nil
)
guard let destination = CGImageDestinationCreateWithURL(
    outputURL as CFURL,
    "public.jpeg" as CFString,
    1,
    nil
) else {
    throw NSError(domain: "VideoPoster", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "Cannot create poster image"
    ])
}
CGImageDestinationAddImage(destination, image, [
    kCGImageDestinationLossyCompressionQuality: 0.88
] as CFDictionary)
guard CGImageDestinationFinalize(destination) else {
    throw NSError(domain: "VideoPoster", code: 2, userInfo: [
        NSLocalizedDescriptionKey: "Cannot write poster image"
    ])
}
print("wrote \(outputURL.path)")
