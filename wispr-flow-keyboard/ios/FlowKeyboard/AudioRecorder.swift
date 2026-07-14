import AVFoundation

/// Records microphone audio to an AAC .m4a file and exposes a metered level
/// for the waveform UI.
///
/// Note: recording inside a keyboard extension requires the user to enable
/// “Allow Full Access” for the keyboard AND grant microphone permission. If
/// the OS refuses the session, `start()` throws and the UI surfaces the error.
final class AudioRecorder: NSObject {
    private var recorder: AVAudioRecorder?
    private(set) var fileURL: URL?

    var isRecording: Bool { recorder?.isRecording ?? false }

    func requestPermission() async -> Bool {
        await withCheckedContinuation { cont in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                cont.resume(returning: granted)
            }
        }
    }

    func start() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers])
        try session.setActive(true, options: .notifyOthersOnDeactivation)

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathExtension("m4a")

        // 16 kHz mono AAC — small uploads, plenty for Whisper.
        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: 16_000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue,
        ]

        let rec = try AVAudioRecorder(url: url, settings: settings)
        rec.isMeteringEnabled = true
        guard rec.record() else {
            throw NSError(
                domain: "FlowKeyboard", code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Could not start recording — check Full Access and microphone permission."]
            )
        }
        recorder = rec
        fileURL = url
    }

    /// Normalized 0…1 level for the waveform.
    func currentLevel() -> Float {
        guard let rec = recorder, rec.isRecording else { return 0.06 }
        rec.updateMeters()
        let db = rec.averagePower(forChannel: 0) // -160…0 dB
        let normalized = pow(10, db / 20)        // 0…1 amplitude
        return max(0.06, min(1, normalized * 6))
    }

    /// Stops recording and returns the finished file.
    func stop() -> URL? {
        recorder?.stop()
        recorder = nil
        deactivateSession()
        return fileURL
    }

    /// Stops recording and deletes the file.
    func cancel() {
        recorder?.stop()
        recorder = nil
        deactivateSession()
        if let url = fileURL {
            try? FileManager.default.removeItem(at: url)
        }
        fileURL = nil
    }

    private func deactivateSession() {
        try? AVAudioSession.sharedInstance()
            .setActive(false, options: .notifyOthersOnDeactivation)
    }
}
