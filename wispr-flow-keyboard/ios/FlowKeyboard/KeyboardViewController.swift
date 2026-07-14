import SwiftUI
import UIKit

/// The keyboard extension's principal class (see Info.plist). Hosts the
/// SwiftUI keyboard and bridges it to the system text field via
/// `textDocumentProxy`.
final class KeyboardViewController: UIInputViewController {
    private let dictation = DictationController()
    private var host: UIHostingController<KeyboardRootView>?

    override func viewDidLoad() {
        super.viewDidLoad()

        dictation.contextProvider = { [weak self] in
            self?.textDocumentProxy.documentContextBeforeInput ?? ""
        }
        dictation.onResult = { [weak self] text in
            self?.insertDictated(text)
        }

        let actions = KeyActions(
            insert: { [weak self] text in
                self?.textDocumentProxy.insertText(text)
            },
            backspace: { [weak self] in
                self?.textDocumentProxy.deleteBackward()
            },
            returnKey: { [weak self] in
                self?.textDocumentProxy.insertText("\n")
            },
            nextKeyboard: { [weak self] in
                self?.advanceToNextInputMode()
            },
            needsGlobe: needsInputModeSwitchKey,
            hasFullAccess: hasFullAccess
        )

        let host = UIHostingController(
            rootView: KeyboardRootView(dictation: dictation, actions: actions)
        )
        host.view.backgroundColor = .clear
        addChild(host)
        view.addSubview(host.view)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            host.view.topAnchor.constraint(equalTo: view.topAnchor),
            host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
        host.didMove(toParent: self)
        self.host = host

        // Keyboard extensions must declare their own height.
        let height = view.heightAnchor.constraint(equalToConstant: 268)
        height.priority = .init(999)
        height.isActive = true
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        // Never leave the mic running if the keyboard is dismissed mid-dictation.
        dictation.cancel()
    }

    /// Insert transcribed text with a smart leading space, matching the web app.
    private func insertDictated(_ text: String) {
        let before = textDocumentProxy.documentContextBeforeInput ?? ""
        let needsSpace = !before.isEmpty && !(before.last?.isWhitespace ?? true)
        textDocumentProxy.insertText((needsSpace ? " " : "") + text)
    }
}
