import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/avisos.dart';
import '../../../core/widgets/estados.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../api/perfil_api.dart';
import '../models/perfil_models.dart';

/// `/perfil/dos-pasos`: activar o desactivar la verificación en dos pasos (TOTP).
class DosPasosPage extends StatefulWidget {
  const DosPasosPage({
    super.key,
    required this.perfilApi,
    this.cargarAlIniciar = true,
  });

  final PerfilApi perfilApi;
  final bool cargarAlIniciar;

  @override
  State<DosPasosPage> createState() => _DosPasosPageState();
}

class _DosPasosPageState extends State<DosPasosPage> {
  final _codigoCtrl = TextEditingController();
  final _credencialDesactivarCtrl = TextEditingController();

  EstadoDosPasosDto? _estado;
  InicioDosPasosDto? _inicio;
  List<String>? _codigosRecuperacion;
  bool _cargando = false;
  bool _ocupado = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.cargarAlIniciar) _cargar();
  }

  @override
  void dispose() {
    _codigoCtrl.dispose();
    _credencialDesactivarCtrl.dispose();
    super.dispose();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final estado = await widget.perfilApi.estadoDosPasos();
      if (mounted) setState(() => _estado = estado);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'No se pudo consultar el estado de 2FA.');
      }
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _iniciar() async {
    setState(() => _ocupado = true);
    try {
      await ejecutarConAviso(context, () async {
        final datos = await widget.perfilApi.iniciarDosPasos();
        if (mounted) {
          setState(() {
            _inicio = datos;
            _codigosRecuperacion = null;
          });
        }
      }, error: 'No se pudo iniciar la configuración de 2FA.');
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _activar() async {
    final codigo = _codigoCtrl.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(codigo)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Introduce el código de 6 dígitos.')),
      );
      return;
    }
    setState(() => _ocupado = true);
    try {
      final ok = await ejecutarConAviso(
        context,
        () async {
          final codigos = await widget.perfilApi.activarDosPasos(codigo);
          if (mounted) {
            setState(() {
              _codigosRecuperacion = codigos;
              _inicio = null;
              _codigoCtrl.clear();
            });
          }
        },
        error: 'Código inválido o expirado.',
        exito: 'Verificación en dos pasos activada.',
      );
      if (ok) await _cargar();
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _desactivar() async {
    final valor = _credencialDesactivarCtrl.text.trim();
    if (valor.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Escribe tu contraseña o un código de 6 dígitos.'),
        ),
      );
      return;
    }
    final esCodigo =
        RegExp(r'^\d{6}$').hasMatch(valor) ||
        RegExp(r'^[a-zA-Z0-9]+-[a-zA-Z0-9]+$').hasMatch(valor);
    setState(() => _ocupado = true);
    try {
      final ok = await ejecutarConAviso(
        context,
        () => widget.perfilApi.desactivarDosPasos(
          codigo: esCodigo ? valor : null,
          password: esCodigo ? null : valor,
        ),
        error: 'No se pudo desactivar. Revisa tu contraseña o código.',
        exito: 'Verificación en dos pasos desactivada.',
      );
      if (ok && mounted) {
        _credencialDesactivarCtrl.clear();
        setState(() => _codigosRecuperacion = null);
        await _cargar();
      }
    } finally {
      if (mounted) setState(() => _ocupado = false);
    }
  }

  Future<void> _copiar(String texto, String mensaje) async {
    await Clipboard.setData(ClipboardData(text: texto));
    if (mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(mensaje)));
    }
  }

  Future<void> _abrirAuthenticator(String uri) async {
    final parsed = Uri.tryParse(uri);
    if (parsed != null && await canLaunchUrl(parsed)) {
      await launchUrl(parsed, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se encontró una app autenticadora instalada.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final estado = _estado;

    return Scaffold(
      appBar: AppBar(title: const Text('Verificación en dos pasos')),
      body: _cargando && estado == null
          ? const EstadoCargando()
          : _error != null && estado == null
          ? EstadoError(mensaje: _error!, onReintentar: _cargar)
          : ListView(
              padding: const EdgeInsets.only(top: 8, bottom: 40),
              children: <Widget>[
                TarjetaSeccion(
                  mostrarDivisores: false,
                  paddingInterno: const EdgeInsets.all(16),
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        IconoCaja(
                          icono: estado?.isActivo == true
                              ? LucideIcons.shieldCheck
                              : LucideIcons.shieldAlert,
                          color: estado?.isActivo == true
                              ? colores.emeraldExito
                              : colores.amberAviso,
                          fondo: estado?.isActivo == true
                              ? colores.emeraldSuave
                              : colores.amberSuave,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                estado?.isActivo == true
                                    ? 'Protección activa'
                                    : 'No activada',
                                style: textTheme.titleMedium,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                estado?.isActivo == true
                                    ? 'Códigos de recuperación disponibles: ${estado!.codigosRestantes}'
                                    : 'Añade un código temporal de tu app autenticadora al iniciar sesión.',
                                style: textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (estado?.isActivo != true &&
                        _inicio == null) ...<Widget>[
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _ocupado ? null : _iniciar,
                        child: const Text(
                          'Configurar verificación en dos pasos',
                        ),
                      ),
                    ],
                  ],
                ),
                if (_inicio != null) ...<Widget>[
                  const SizedBox(height: 16),
                  TarjetaSeccion(
                    titulo: 'Configurar app autenticadora',
                    mostrarDivisores: false,
                    paddingInterno: const EdgeInsets.all(16),
                    children: <Widget>[
                      Text(
                        'Abre tu app autenticadora (Google Authenticator, 1Password, Authy…) o copia la clave secreta manualmente:',
                        style: textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: colores.elevada,
                          borderRadius: BorderRadius.circular(
                            TemaApp.radioControl,
                          ),
                        ),
                        child: Row(
                          children: <Widget>[
                            Expanded(
                              child: SelectableText(
                                _inicio!.secreto,
                                style: textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            IconButton(
                              tooltip: 'Copiar clave',
                              onPressed: () => _copiar(
                                _inicio!.secreto,
                                'Clave copiada al portapapeles.',
                              ),
                              icon: const Icon(LucideIcons.copy, size: 18),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => _abrirAuthenticator(_inicio!.uri),
                        icon: const Icon(LucideIcons.externalLink, size: 16),
                        label: const Text('Abrir en app autenticadora'),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _codigoCtrl,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        decoration: const InputDecoration(
                          labelText: 'Código de 6 dígitos',
                          hintText: '123456',
                          counterText: '',
                        ),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: _ocupado ? null : _activar,
                        child: const Text('Activar'),
                      ),
                    ],
                  ),
                ],
                if (_codigosRecuperacion != null &&
                    _codigosRecuperacion!.isNotEmpty) ...<Widget>[
                  const SizedBox(height: 16),
                  TarjetaSeccion(
                    titulo: 'Códigos de recuperación',
                    mostrarDivisores: false,
                    paddingInterno: const EdgeInsets.all(16),
                    children: <Widget>[
                      Text(
                        'Guarda estos códigos en un lugar seguro. Solo se muestran una vez y sirven si pierdes acceso a tu app autenticadora.',
                        style: textTheme.bodySmall,
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: <Widget>[
                          for (final c in _codigosRecuperacion!)
                            InsigniaPill(texto: c),
                        ],
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () => _copiar(
                          _codigosRecuperacion!.join('\n'),
                          'Códigos copiados al portapapeles.',
                        ),
                        icon: const Icon(LucideIcons.copy, size: 16),
                        label: const Text('Copiar todos los códigos'),
                      ),
                    ],
                  ),
                ],
                if (estado?.isActivo == true) ...<Widget>[
                  const SizedBox(height: 16),
                  TarjetaSeccion(
                    titulo: 'Desactivar verificación en dos pasos',
                    mostrarDivisores: false,
                    paddingInterno: const EdgeInsets.all(16),
                    children: <Widget>[
                      TextField(
                        controller: _credencialDesactivarCtrl,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Contraseña o código TOTP',
                        ),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: _ocupado ? null : _desactivar,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: colores.rosePeligro,
                          side: BorderSide(
                            color: colores.rosePeligro.withValues(alpha: 0.4),
                          ),
                        ),
                        child: const Text('Desactivar 2FA'),
                      ),
                    ],
                  ),
                ],
              ],
            ),
    );
  }
}
