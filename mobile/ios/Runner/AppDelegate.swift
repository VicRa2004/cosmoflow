import Flutter
import ObjectiveC.runtime
import UIKit
import WebKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    Self.ocultarBarraTecladoWebView()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }

  /// Oculta la barra nativa de accesorios (`^ v ✓`) que iOS añade encima del
  /// teclado dentro de `WKWebView` (usado por el editor Markdown de notas).
  private static func ocultarBarraTecladoWebView() {
    _ = WKWebView.self
    guard let wkContentViewClass: AnyClass = NSClassFromString("WKContentView") else {
      return
    }
    let selector = #selector(getter: UIResponder.inputAccessoryView)
    let nilBlock: @convention(block) (AnyObject) -> UIView? = { _ in nil }
    let imp = imp_implementationWithBlock(nilBlock)
    if let method = class_getInstanceMethod(wkContentViewClass, selector) {
      method_setImplementation(method, imp)
    } else {
      class_addMethod(wkContentViewClass, selector, imp, "@@:")
    }
  }
}
