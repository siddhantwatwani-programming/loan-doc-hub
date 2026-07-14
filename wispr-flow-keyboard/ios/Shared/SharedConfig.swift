import Foundation

/// Configuration shared between the host app and the keyboard extension via
/// an App Group. The host app writes the Supabase credentials; the keyboard
/// reads them to call the `transcribe` edge function.
///
/// ⚠️ Change `appGroupID` to an App Group registered to YOUR team, and keep it
/// in sync with both .entitlements files and project.yml.
enum SharedConfig {
    static let appGroupID = "group.com.example.flowkeyboard"

    private static let urlKey = "supabase_url"
    private static let anonKeyKey = "supabase_anon_key"
    private static let styleKey = "format_style"

    static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroupID)
    }

    static var supabaseURL: String {
        get { defaults?.string(forKey: urlKey) ?? "" }
        set { defaults?.set(newValue, forKey: urlKey) }
    }

    static var supabaseAnonKey: String {
        get { defaults?.string(forKey: anonKeyKey) ?? "" }
        set { defaults?.set(newValue, forKey: anonKeyKey) }
    }

    /// Formatting hint passed to the edge function: auto | message | email | notes
    static var formatStyle: String {
        get { defaults?.string(forKey: styleKey) ?? "auto" }
        set { defaults?.set(newValue, forKey: styleKey) }
    }

    static var isConfigured: Bool {
        !supabaseURL.isEmpty && !supabaseAnonKey.isEmpty
    }
}
