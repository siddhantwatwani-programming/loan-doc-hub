import SwiftUI

/// Callbacks from SwiftUI into the UIInputViewController.
struct KeyActions {
    var insert: (String) -> Void
    var backspace: () -> Void
    var returnKey: () -> Void
    var nextKeyboard: () -> Void
    var needsGlobe: Bool
    var hasFullAccess: Bool
}

private enum KeyboardMode { case letters, numbers, symbols }
private enum ShiftState { case off, on, caps }

private let flowPurple = Color(red: 0.49, green: 0.36, blue: 0.99)
private let flowGlow = Color(red: 0.66, green: 0.55, blue: 1.0)
private let flowDark = Color(red: 0.36, green: 0.25, blue: 0.88)

// MARK: - Root

struct KeyboardRootView: View {
    @ObservedObject var dictation: DictationController
    let actions: KeyActions

    var body: some View {
        ZStack(alignment: .bottom) {
            KeyboardPanel(dictation: dictation, actions: actions)
                .opacity(dictation.isActive ? 0 : 1)

            if dictation.isActive {
                FlowSheetView(dictation: dictation)
                    .transition(.move(edge: .bottom))
            }

            if case .error(let message) = dictation.status {
                ErrorBanner(message: message) { dictation.reset() }
            }
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.9), value: dictation.isActive)
        .frame(height: 268)
        .background(Color(red: 0.82, green: 0.84, blue: 0.86))
    }
}

// MARK: - Keyboard

private struct KeyboardPanel: View {
    @ObservedObject var dictation: DictationController
    let actions: KeyActions

    @State private var mode: KeyboardMode = .letters
    @State private var shift: ShiftState = .on

    private let letterRows = [
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["z", "x", "c", "v", "b", "n", "m"],
    ]
    private let numberRows = [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""],
        [".", ",", "?", "!", "'"],
    ]
    private let symbolRows = [
        ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
        ["_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"],
        [".", ",", "?", "!", "'"],
    ]

    private var rows: [[String]] {
        switch mode {
        case .letters: return letterRows
        case .numbers: return numberRows
        case .symbols: return symbolRows
        }
    }

    var body: some View {
        GeometryReader { geo in
            let keyWidth = (geo.size.width - 6 - 9 * 6) / 10

            VStack(spacing: 11) {
                // Row 1 (10 keys)
                keyRow(rows[0], keyWidth: keyWidth)

                // Row 2 (9 letters, or 10 punctuation)
                keyRow(rows[1], keyWidth: keyWidth)

                // Row 3: shift/mode + keys + backspace
                HStack(spacing: 6) {
                    if mode == .letters {
                        FunctionCap(width: keyWidth * 1.4) {
                            shiftIcon
                        } action: {
                            shift = shift == .off ? .on : (shift == .on ? .caps : .off)
                        }
                    } else {
                        FunctionCap(width: keyWidth * 1.4) {
                            Text(mode == .numbers ? "#+=" : "123").font(.system(size: 15))
                        } action: {
                            mode = mode == .numbers ? .symbols : .numbers
                        }
                    }

                    Spacer(minLength: 0)
                    ForEach(rows[2], id: \.self) { key in
                        KeyCap(label: display(key), width: keyWidth) { emit(key) }
                    }
                    Spacer(minLength: 0)

                    FunctionCap(width: keyWidth * 1.4) {
                        Image(systemName: "delete.left").font(.system(size: 17))
                    } action: {
                        actions.backspace()
                    }
                }

                // Bottom row: mode / globe / space / flow / return
                HStack(spacing: 6) {
                    FunctionCap(width: keyWidth * 1.3) {
                        Text(mode == .letters ? "123" : "ABC").font(.system(size: 15))
                    } action: {
                        mode = mode == .letters ? .numbers : .letters
                    }

                    if actions.needsGlobe {
                        FunctionCap(width: keyWidth) {
                            Image(systemName: "globe").font(.system(size: 16))
                        } action: {
                            actions.nextKeyboard()
                        }
                    }

                    KeyCap(label: "space", width: nil, isSpace: true) {
                        actions.insert(" ")
                    }
                    .frame(maxWidth: .infinity)

                    FlowKeyView(status: dictation.status, width: keyWidth * 1.3) {
                        dictation.start()
                    }

                    FunctionCap(width: keyWidth * 1.9) {
                        Text("return").font(.system(size: 15))
                    } action: {
                        actions.returnKey()
                    }
                }
            }
            .padding(.horizontal, 3)
            .padding(.top, 8)
        }
        .overlay(alignment: .top) {
            if !actions.hasFullAccess {
                Text("Enable Full Access in Settings to use Flow dictation")
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .padding(.top, -2)
            }
        }
    }

    private var shiftIcon: some View {
        Image(systemName: shift == .caps ? "capslock.fill" : (shift == .on ? "shift.fill" : "shift"))
            .font(.system(size: 17))
    }

    private func display(_ key: String) -> String {
        mode == .letters && shift != .off ? key.uppercased() : key
    }

    private func emit(_ key: String) {
        if mode == .letters {
            actions.insert(shift == .off ? key : key.uppercased())
            if shift == .on { shift = .off }
        } else {
            actions.insert(key)
        }
    }

    private func keyRow(_ keys: [String], keyWidth: CGFloat) -> some View {
        HStack(spacing: 6) {
            Spacer(minLength: 0)
            ForEach(keys, id: \.self) { key in
                KeyCap(label: display(key), width: keyWidth) { emit(key) }
            }
            Spacer(minLength: 0)
        }
    }
}

// MARK: - Key caps

private struct KeyCap: View {
    let label: String
    let width: CGFloat?
    var isSpace = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: isSpace ? 15 : 21))
                .foregroundStyle(isSpace ? Color.black.opacity(0.45) : .black)
                .frame(maxWidth: width == nil ? .infinity : nil)
                .frame(width: width, height: 42)
                .background(
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.white)
                        .shadow(color: .black.opacity(0.28), radius: 0, y: 1)
                )
        }
        .buttonStyle(KeyPressStyle())
    }
}

private struct FunctionCap<Content: View>: View {
    let width: CGFloat
    @ViewBuilder let content: () -> Content
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            content()
                .foregroundStyle(.black.opacity(0.75))
                .frame(width: width, height: 42)
                .background(
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(red: 0.68, green: 0.71, blue: 0.75))
                        .shadow(color: .black.opacity(0.28), radius: 0, y: 1)
                )
        }
        .buttonStyle(KeyPressStyle())
    }
}

private struct KeyPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.55 : 1)
    }
}

// MARK: - Flow key

private struct FlowKeyView: View {
    let status: DictationController.Status
    let width: CGFloat
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(
                        LinearGradient(
                            colors: [flowGlow, flowDark],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .shadow(color: .black.opacity(0.28), radius: 0, y: 1)
                if status == .requesting || status == .transcribing {
                    ProgressView().tint(.white)
                } else {
                    Image(systemName: "mic.fill")
                        .font(.system(size: 17))
                        .foregroundStyle(.white)
                }
            }
            .frame(width: width, height: 42)
        }
        .buttonStyle(KeyPressStyle())
        .accessibilityLabel("Start Flow dictation")
    }
}

// MARK: - Listening sheet

private struct FlowSheetView: View {
    @ObservedObject var dictation: DictationController

    private var transcribing: Bool { dictation.status == .transcribing }

    var body: some View {
        VStack(spacing: 14) {
            Capsule()
                .fill(.white.opacity(0.2))
                .frame(width: 36, height: 4)
                .padding(.top, 10)

            HStack(spacing: 8) {
                Circle()
                    .fill(transcribing ? flowGlow : Color.red)
                    .frame(width: 8, height: 8)
                Text(transcribing ? "Cleaning up your words…" : "Listening")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(flowGlow)
                Spacer()
                Text(timeString)
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.5))
            }
            .padding(.horizontal, 20)

            // Waveform
            HStack(spacing: 3) {
                ForEach(Array(dictation.levels.enumerated()), id: \.offset) { _, level in
                    Capsule()
                        .fill(LinearGradient(colors: [flowPurple, flowGlow], startPoint: .bottom, endPoint: .top))
                        .frame(width: 4, height: max(6, CGFloat(transcribing ? 0.18 : level) * 56))
                        .opacity(transcribing ? 0.4 : 0.65 + Double(level) * 0.35)
                }
            }
            .frame(height: 56)
            .animation(.linear(duration: 0.06), value: dictation.levels)

            HStack {
                RoundButton(systemName: "xmark", background: .white.opacity(0.08), disabled: transcribing) {
                    dictation.cancel()
                }
                Spacer()
                Text(transcribing
                     ? "Formatting punctuation and tone automatically"
                     : "Speak naturally — Flow handles punctuation")
                    .font(.system(size: 12))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.white.opacity(0.4))
                    .frame(maxWidth: 170)
                Spacer()
                RoundButton(systemName: "checkmark", background: flowPurple, disabled: transcribing) {
                    dictation.stop()
                }
            }
            .padding(.horizontal, 24)

            Spacer(minLength: 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            UnevenRoundedRectangle(topLeadingRadius: 20, topTrailingRadius: 20)
                .fill(Color(red: 0.06, green: 0.06, blue: 0.09))
        )
    }

    private var timeString: String {
        let s = Int(dictation.elapsed)
        return String(format: "%d:%02d", s / 60, s % 60)
    }
}

private struct RoundButton: View {
    let systemName: String
    let background: Color
    let disabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 48, height: 48)
                .background(Circle().fill(background))
        }
        .disabled(disabled)
        .opacity(disabled ? 0.4 : 1)
    }
}

// MARK: - Error banner

private struct ErrorBanner: View {
    let message: String
    let dismiss: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Text(message)
                .font(.system(size: 13))
                .foregroundStyle(.white)
            Button("Dismiss", action: dismiss)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(RoundedRectangle(cornerRadius: 12).fill(Color.red))
        .padding(12)
    }
}
