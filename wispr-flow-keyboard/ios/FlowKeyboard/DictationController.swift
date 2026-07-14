import Foundation
import Combine

/// State machine driving the Flow dictation experience — the Swift twin of
/// src/hooks/useDictation.ts in the web app.
@MainActor
final class DictationController: ObservableObject {
    enum Status: Equatable {
        case idle
        case requesting
        case recording
        case transcribing
        case error(String)
    }

    static let barCount = 28

    @Published private(set) var status: Status = .idle
    @Published private(set) var levels: [Float] = Array(repeating: 0.06, count: barCount)
    @Published private(set) var elapsed: TimeInterval = 0

    /// Set by the view controller: inserts finished text at the cursor.
    var onResult: ((String) -> Void)?
    /// Set by the view controller: text before the cursor, for formatting continuity.
    var contextProvider: (() -> String)?

    private let recorder = AudioRecorder()
    private var meterTimer: Timer?
    private var startedAt: Date?

    var isActive: Bool {
        switch status {
        case .recording, .transcribing, .requesting: return true
        default: return false
        }
    }

    func start() {
        guard status == .idle || isError else { return }
        status = .requesting

        Task {
            guard await recorder.requestPermission() else {
                status = .error("Microphone access denied. Enable Full Access for Flow Keyboard, then allow the mic.")
                return
            }
            do {
                try recorder.start()
                startedAt = Date()
                status = .recording
                startMetering()
            } catch {
                status = .error(error.localizedDescription)
            }
        }
    }

    func stop() {
        guard status == .recording else { return }
        stopMetering()
        guard let file = recorder.stop() else {
            status = .error("Recording produced no audio.")
            return
        }
        status = .transcribing

        let context = contextProvider?() ?? ""
        Task {
            defer { try? FileManager.default.removeItem(at: file) }
            do {
                let text = try await TranscriptionClient.transcribe(audioFile: file, context: context)
                if !text.isEmpty {
                    onResult?(text)
                }
                reset()
            } catch {
                status = .error(error.localizedDescription)
            }
        }
    }

    func cancel() {
        stopMetering()
        recorder.cancel()
        reset()
    }

    func reset() {
        stopMetering()
        status = .idle
        elapsed = 0
        levels = Array(repeating: 0.06, count: Self.barCount)
    }

    private var isError: Bool {
        if case .error = status { return true }
        return false
    }

    private func startMetering() {
        meterTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self else { return }
                var next = self.levels
                next.removeFirst()
                next.append(self.recorder.currentLevel())
                self.levels = next
                if let started = self.startedAt {
                    self.elapsed = Date().timeIntervalSince(started)
                }
            }
        }
    }

    private func stopMetering() {
        meterTimer?.invalidate()
        meterTimer = nil
    }
}
