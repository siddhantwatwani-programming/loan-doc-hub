import SwiftUI

/// Host-app screen: setup checklist + Supabase credential entry.
/// The keyboard extension reads these values through the App Group.
struct ContentView: View {
    @State private var supabaseURL = SharedConfig.supabaseURL
    @State private var anonKey = SharedConfig.supabaseAnonKey
    @State private var style = SharedConfig.formatStyle
    @State private var saved = false

    private let flowPurple = Color(red: 0.49, green: 0.36, blue: 0.99)

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 10) {
                            Image(systemName: "waveform")
                                .font(.title2.bold())
                                .foregroundStyle(flowPurple)
                            Text("Flow Keyboard")
                                .font(.title2.bold())
                        }
                        Text("The keyboard that types what you say. Tap the purple key in the keyboard, speak, and Flow inserts clean, formatted text.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                }

                Section("1 · Enable the keyboard") {
                    step("Open Settings → General → Keyboard → Keyboards")
                    step("Add New Keyboard… → Flow Keyboard")
                    step("Tap Flow Keyboard again and turn on “Allow Full Access” (needed for network + microphone)")
                    Button {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        Label("Open Settings", systemImage: "gear")
                    }
                }

                Section("2 · Connect transcription") {
                    TextField("Supabase URL (https://xyz.supabase.co)", text: $supabaseURL)
                        .textContentType(.URL)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    SecureField("Supabase anon (publishable) key", text: $anonKey)
                    Picker("Formatting style", selection: $style) {
                        Text("Auto").tag("auto")
                        Text("Message").tag("message")
                        Text("Email").tag("email")
                        Text("Notes").tag("notes")
                    }
                    Button {
                        SharedConfig.supabaseURL = supabaseURL
                            .trimmingCharacters(in: .whitespacesAndNewlines)
                        SharedConfig.supabaseAnonKey = anonKey
                            .trimmingCharacters(in: .whitespacesAndNewlines)
                        SharedConfig.formatStyle = style
                        saved = true
                    } label: {
                        Label(saved ? "Saved" : "Save", systemImage: saved ? "checkmark.circle.fill" : "square.and.arrow.down")
                    }
                    .tint(flowPurple)
                } footer: {
                    Text("Your OpenAI key never goes on the phone — it lives as a secret on the Supabase edge function. The keyboard only talks to your Supabase project.")
                }

                Section("3 · Try it") {
                    step("Open Notes or Messages, long-press the globe key and pick Flow Keyboard")
                    step("Tap the purple mic key and just talk")
                    TextField("Test the keyboard here…", text: .constant(""))
                }
            }
            .navigationTitle("Flow")
            .onChange(of: supabaseURL) { _ in saved = false }
            .onChange(of: anonKey) { _ in saved = false }
        }
    }

    private func step(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "circle.fill")
                .font(.system(size: 6))
                .foregroundStyle(flowPurple)
                .padding(.top, 6)
            Text(text).font(.subheadline)
        }
    }
}

#Preview {
    ContentView()
}
