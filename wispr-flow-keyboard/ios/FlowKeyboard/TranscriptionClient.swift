import Foundation

/// Calls the Supabase `transcribe` edge function (Whisper + GPT formatting)
/// with the recorded audio file. Mirrors src/lib/transcribe.ts in the web app.
enum TranscriptionClient {
    struct TranscriptionError: LocalizedError {
        let message: String
        var errorDescription: String? { message }
    }

    static func transcribe(audioFile: URL, context: String) async throws -> String {
        guard SharedConfig.isConfigured else {
            throw TranscriptionError(
                message: "Not configured — open the Flow app and add your Supabase URL and anon key."
            )
        }

        let base = SharedConfig.supabaseURL.hasSuffix("/")
            ? String(SharedConfig.supabaseURL.dropLast())
            : SharedConfig.supabaseURL
        guard let url = URL(string: "\(base)/functions/v1/transcribe") else {
            throw TranscriptionError(message: "Invalid Supabase URL.")
        }

        let boundary = "flow-\(UUID().uuidString)"
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 60
        request.setValue("Bearer \(SharedConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(SharedConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        func field(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }

        field("style", SharedConfig.formatStyle)
        if !context.isEmpty {
            field("context", String(context.suffix(500)))
        }

        let audioData = try Data(contentsOf: audioFile)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append(
            "Content-Disposition: form-data; name=\"file\"; filename=\"speech.m4a\"\r\n".data(using: .utf8)!
        )
        body.append("Content-Type: audio/mp4\r\n\r\n".data(using: .utf8)!)
        body.append(audioData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw TranscriptionError(message: "No response from server.")
        }
        guard (200..<300).contains(http.statusCode) else {
            let detail = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String
            throw TranscriptionError(message: detail ?? "Transcription failed (HTTP \(http.statusCode)).")
        }

        guard
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let text = json["text"] as? String
        else {
            throw TranscriptionError(message: "Malformed response from transcribe function.")
        }

        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
