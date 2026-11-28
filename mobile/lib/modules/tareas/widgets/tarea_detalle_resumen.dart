import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/theme/colores_noche_indigo.dart';
import '../../../core/theme/tema_app.dart';
import '../../../core/widgets/avatar_usuario.dart';
import '../../../core/widgets/tarjeta_seccion.dart';
import '../../organizaciones/services/contexto_organizacion_cache.dart';
import '../../tags/models/tag_model.dart';
import '../models/tarea_model.dart';

/// Formatea una fecha `AAAA-MM-DD` a texto humano compacto (`Hoy`, `Mañana`, `27 nov 2026`).
String formatearFechaHumana(String? iso, {bool marcarRelativa = false}) {
  if (iso == null || iso.trim().isEmpty) return 'Sin fecha';
  final fecha = DateTime.tryParse(iso.trim());
  if (fecha == null) return iso;
  final ahora = DateTime.now();
  if (marcarRelativa) {
    final hoy = DateTime(ahora.year, ahora.month, ahora.day);
    final diff = fecha.difference(hoy).inDays;
    if (diff == 0) return 'Hoy';
    if (diff == 1) return 'Mañana';
    if (diff == -1) return 'Ayer';
  }
  const meses = <String>[
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  final mes = meses[fecha.month - 1];
  return fecha.year == ahora.year
      ? '${fecha.day} $mes'
      : '${fecha.day} $mes ${fecha.year}';
}

/// Píldoras de ubicación (Personal o Organización / Equipo / Proyecto).
class InsigniasUbicacionTarea extends StatelessWidget {
  const InsigniasUbicacionTarea({
    super.key,
    required this.tarea,
    this.ubicacion,
  });

  final TareaDto tarea;
  final UbicacionTarea? ubicacion;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    if (!tarea.isCompartida) {
      return const Wrap(
        spacing: 6,
        runSpacing: 6,
        children: <Widget>[
          InsigniaPill(texto: 'Personal', icono: LucideIcons.user),
        ],
      );
    }

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: <Widget>[
        InsigniaPill(
          texto: ubicacion?.organizacionNombre ?? 'Organización',
          icono: LucideIcons.building2,
          colorTexto: colores.indigoMarca,
          colorFondo: colores.indigoSuave,
        ),
        if (tarea.equipoId != null)
          InsigniaPill(
            texto: ubicacion?.equipoNombre != null
                ? 'Equipo · ${ubicacion!.equipoNombre}'
                : 'Equipo',
            icono: LucideIcons.users,
            colorTexto: colores.indigoMarca,
            colorFondo: colores.indigoSuave,
          ),
        if (tarea.proyectoId != null)
          InsigniaPill(
            texto: ubicacion?.proyectoNombre != null
                ? 'Proyecto · ${ubicacion!.proyectoNombre}'
                : 'Proyecto',
            icono: LucideIcons.folderKanban,
            colorTexto: colores.indigoMarca,
            colorFondo: colores.indigoSuave,
          ),
      ],
    );
  }
}

/// Fila compacta de pills debajo del título: estado (tappable), prioridad, recurrencia y tags.
class ChipsEstadoPrioridadTarea extends StatelessWidget {
  const ChipsEstadoPrioridadTarea({
    super.key,
    required this.tarea,
    required this.tags,
    this.onCambiarEstado,
  });

  final TareaDto tarea;
  final List<TagDto> tags;
  final ValueChanged<EstadoTarea>? onCambiarEstado;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final (colorEstado, fondoEstado) = switch (tarea.estado) {
      EstadoTarea.completada => (colores.emeraldExito, colores.emeraldSuave),
      EstadoTarea.enProgreso => (colores.indigoMarca, colores.indigoSuave),
      EstadoTarea.cancelada => (colores.tintaTenue, colores.elevada),
      EstadoTarea.pendiente => (colores.amberAviso, colores.amberSuave),
    };
    final (colorPrio, fondoPrio) = switch (tarea.prioridad) {
      PrioridadTarea.alta => (colores.rosePeligro, colores.roseSuave),
      PrioridadTarea.media => (colores.amberAviso, colores.amberSuave),
      PrioridadTarea.baja => (colores.tintaSuave, colores.elevada),
    };

    final pillEstado = InsigniaPill(
      texto: tarea.estado.etiqueta,
      icono: LucideIcons.circleDot,
      colorTexto: colorEstado,
      colorFondo: fondoEstado,
    );

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: <Widget>[
        if (onCambiarEstado != null)
          PopupMenuButton<EstadoTarea>(
            tooltip: 'Cambiar estado',
            onSelected: onCambiarEstado,
            itemBuilder: (_) => <PopupMenuEntry<EstadoTarea>>[
              for (final e in EstadoTarea.values)
                CheckedPopupMenuItem<EstadoTarea>(
                  value: e,
                  checked: tarea.estado == e,
                  child: Text(e.etiqueta),
                ),
            ],
            child: pillEstado,
          )
        else
          pillEstado,
        InsigniaPill(
          texto: 'Prioridad ${tarea.prioridad.etiqueta.toLowerCase()}',
          icono: LucideIcons.flag,
          colorTexto: colorPrio,
          colorFondo: fondoPrio,
        ),
        if (tarea.recurrencia != null)
          InsigniaPill(
            texto: tarea.recurrencia!.etiqueta,
            icono: LucideIcons.repeat,
            colorTexto: colores.indigoMarca,
            colorFondo: colores.indigoSuave,
          ),
        for (final tag in tags)
          InsigniaPill(
            texto: '#${tag.nombre}',
            colorTexto: colores.tintaSuave,
            colorFondo: colores.elevada,
          ),
      ],
    );
  }
}

/// Tarjeta compacta de propiedades: fechas lado a lado (Inicio | Vence) y
/// filas estilizadas estilo Linear/Notion solo para lo que realmente tiene valor.
class ResumenPropiedadesTarea extends StatelessWidget {
  const ResumenPropiedadesTarea({
    super.key,
    required this.tarea,
    required this.responsables,
    this.ubicacion,
    this.tareaPrincipal,
    this.onAbrirPrincipal,
  });

  final TareaDto tarea;
  final List<({String nombre, String? avatarUrl})> responsables;
  final UbicacionTarea? ubicacion;
  final TareaDto? tareaPrincipal;
  final VoidCallback? onAbrirPrincipal;

  bool _estaVencida() {
    if (!tarea.estado.isAbierta) return false;
    final raw = tarea.fechaVencimiento;
    if (raw == null || raw.isEmpty) return false;
    final f = DateTime.tryParse(raw);
    if (f == null) return false;
    final ahora = DateTime.now();
    final hoy = DateTime(ahora.year, ahora.month, ahora.day);
    return f.isBefore(hoy);
  }

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    final vencida = _estaVencida();
    final tieneFechas =
        (tarea.fechaInicio != null && tarea.fechaInicio!.isNotEmpty) ||
        (tarea.fechaVencimiento != null && tarea.fechaVencimiento!.isNotEmpty);

    final filas = <Widget>[
      if (tieneFechas)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: <Widget>[
              Expanded(
                child: _CeldaFecha(
                  icono: LucideIcons.calendar,
                  etiqueta: 'Inicio',
                  valor: formatearFechaHumana(tarea.fechaInicio),
                  colorValor:
                      tarea.fechaInicio == null || tarea.fechaInicio!.isEmpty
                      ? colores.tintaTenue
                      : colores.tinta,
                ),
              ),
              Container(
                width: 1,
                height: 30,
                color: colores.borde,
                margin: const EdgeInsets.symmetric(horizontal: 12),
              ),
              Expanded(
                child: _CeldaFecha(
                  icono: vencida
                      ? LucideIcons.calendarX
                      : LucideIcons.calendarCheck,
                  etiqueta: vencida ? 'Vencida' : 'Vence',
                  valor: formatearFechaHumana(
                    tarea.fechaVencimiento,
                    marcarRelativa: true,
                  ),
                  colorIcono: vencida ? colores.rosePeligro : null,
                  colorValor: vencida
                      ? colores.rosePeligro
                      : (tarea.fechaVencimiento == null ||
                                tarea.fechaVencimiento!.isEmpty
                            ? colores.tintaTenue
                            : colores.tinta),
                ),
              ),
            ],
          ),
        ),
      if (tarea.isCompartida)
        _FilaPropiedadCompacta(
          icono:
              ubicacion?.icono ??
              (tarea.equipoId != null
                  ? LucideIcons.users
                  : tarea.proyectoId != null
                  ? LucideIcons.folderKanban
                  : LucideIcons.building2),
          etiqueta: 'Ubicación',
          contenido: Text(
            ubicacion?.etiquetaCorta ??
                (tarea.proyectoId != null
                    ? 'Proyecto'
                    : tarea.equipoId != null
                    ? 'Equipo'
                    : 'Organización'),
            style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
            textAlign: TextAlign.end,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      if (responsables.isNotEmpty)
        _FilaPropiedadCompacta(
          icono: LucideIcons.users,
          etiqueta: 'Responsables',
          contenido: Wrap(
            spacing: 8,
            runSpacing: 6,
            alignment: WrapAlignment.end,
            children: <Widget>[
              for (final r in responsables)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    AvatarUsuario(
                      nombre: r.nombre,
                      avatarUrl: r.avatarUrl,
                      tamano: 22,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      r.nombre,
                      style: textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      if (tarea.dependeDeId != null)
        InkWell(
          onTap: onAbrirPrincipal,
          child: _FilaPropiedadCompacta(
            icono: LucideIcons.link,
            etiqueta: 'Depende de',
            contenido: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Flexible(
                  child: Text(
                    tareaPrincipal?.titulo ?? 'Tarea #${tarea.dependeDeId}',
                    style: textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                      color: colores.indigoMarca,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  LucideIcons.chevronRight,
                  size: 16,
                  color: colores.tintaTenue,
                ),
              ],
            ),
          ),
        ),
    ];

    if (filas.isEmpty) return const SizedBox.shrink();

    return TarjetaSeccion(divisorIndent: 14, children: filas);
  }
}

class _CeldaFecha extends StatelessWidget {
  const _CeldaFecha({
    required this.icono,
    required this.etiqueta,
    required this.valor,
    required this.colorValor,
    this.colorIcono,
  });

  final IconData icono;
  final String etiqueta;
  final String valor;
  final Color colorValor;
  final Color? colorIcono;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    return Row(
      children: <Widget>[
        Icon(icono, size: 16, color: colorIcono ?? colores.tintaTenue),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                etiqueta,
                style: textTheme.labelSmall?.copyWith(
                  color: colorIcono ?? colores.tintaTenue,
                ),
              ),
              const SizedBox(height: 1),
              Text(
                valor,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: textTheme.bodyMedium?.copyWith(
                  color: colorValor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FilaPropiedadCompacta extends StatelessWidget {
  const _FilaPropiedadCompacta({
    required this.icono,
    required this.etiqueta,
    required this.contenido,
  });

  final IconData icono;
  final String etiqueta;
  final Widget contenido;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[
          Icon(icono, size: 16, color: colores.tintaTenue),
          const SizedBox(width: 8),
          Text(
            etiqueta,
            style: textTheme.bodySmall?.copyWith(color: colores.tintaTenue),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Align(alignment: Alignment.centerRight, child: contenido),
          ),
        ],
      ),
    );
  }
}

/// Banner compacto cuando la tarea depende de otra sin completar.
class AvisoTareaBloqueada extends StatelessWidget {
  const AvisoTareaBloqueada({super.key, this.tituloPrincipal});

  final String? tituloPrincipal;

  @override
  Widget build(BuildContext context) {
    final colores = context.colores;
    final texto = tituloPrincipal != null
        ? 'Bloqueada: primero hay que completar «$tituloPrincipal».'
        : 'Bloqueada: depende de una tarea sin completar.';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: colores.amberSuave,
        borderRadius: BorderRadius.circular(TemaApp.radioControl),
        border: Border.all(color: colores.amberAviso.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: <Widget>[
          Icon(LucideIcons.lock, size: 17, color: colores.amberAviso),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              texto,
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(color: colores.tinta, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
