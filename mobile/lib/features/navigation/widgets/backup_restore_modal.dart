// lib/features/navigation/widgets/backup_restore_modal.dart
// ─────────────────────────────────────────────────────────────────────────────
// Offline, zero-permission Backup & Restore dialog for user preferences.
// Allows users to export/import theme + search history as UTF-8 JSON via
// clipboard when migrating from GitHub builds to Google Play builds.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/services/user_backup_service.dart';
import '../../../providers/theme_provider.dart';

Future<void> showBackupRestoreModal(BuildContext context) {
  return showDialog<void>(
    context: context,
    builder: (_) => const _BackupRestoreDialog(),
  );
}

class _BackupRestoreDialog extends StatefulWidget {
  const _BackupRestoreDialog();

  @override
  State<_BackupRestoreDialog> createState() => _BackupRestoreDialogState();
}

class _BackupRestoreDialogState extends State<_BackupRestoreDialog> {
  final TextEditingController _restoreController = TextEditingController();
  UserBackupData? _currentSummary;
  String? _statusMessage;
  bool _isError = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _loadSummary();
  }

  @override
  void dispose() {
    _restoreController.dispose();
    super.dispose();
  }

  Future<void> _loadSummary() async {
    final data = await UserBackupService.captureCurrentData();
    if (mounted) {
      setState(() => _currentSummary = data);
    }
  }

  Future<void> _handleExport() async {
    setState(() {
      _busy = true;
      _statusMessage = null;
      _isError = false;
    });
    try {
      final jsonStr = await UserBackupService.exportToJson();
      await Clipboard.setData(ClipboardData(text: jsonStr));
      await _loadSummary();
      if (mounted) {
        setState(() {
          _statusMessage =
              'تم نسخ النسخة الاحتياطية (JSON) إلى الحافظة. احفظها في الملاحظات قبل إلغاء تثبيت النسخة القديمة.';
          _isError = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _statusMessage = 'تعذّر إنشاء النسخة الاحتياطية: $e';
          _isError = true;
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handlePaste() async {
    final data = await Clipboard.getData('text/plain');
    if (data?.text != null && mounted) {
      setState(() {
        _restoreController.text = data!.text!;
        _statusMessage = null;
      });
    }
  }

  Future<void> _handleRestore() async {
    setState(() {
      _busy = true;
      _statusMessage = null;
      _isError = false;
    });
    try {
      final result = await UserBackupService.importFromJson(_restoreController.text);
      if (mounted) {
        await context.read<ThemeProvider>().reloadFromPrefs();
      }
      await _loadSummary();
      if (mounted) {
        final modeLabel = result.isDarkMode ? 'الوضع الليلي' : 'الوضع النهاري';
        setState(() {
          _statusMessage =
              'تمت الاستعادة بنجاح: $modeLabel، و(${result.recentSearchQueries.length}) عبارة في سجل البحث.';
          _isError = false;
        });
      }
    } on UserBackupException catch (e) {
      if (mounted) {
        setState(() {
          _statusMessage = e.message;
          _isError = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _statusMessage = 'حدث خطأ أثناء الاستعادة: $e';
          _isError = true;
        });
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = _currentSummary;
    return Directionality(
      textDirection: TextDirection.rtl,
      child: AlertDialog(
        backgroundColor: AppColors.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: [
            Icon(Icons.settings_backup_restore_rounded, color: AppColors.primary),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                'النسخ الاحتياطي والاستعادة',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'احفظ تفضيلاتك (الوضع الليلي وسجل البحث) محليًا دون إنترنت قبل الانتقال إلى نسخة Google Play.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.45),
              ),
              const SizedBox(height: 12),
              if (summary != null)
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.bgSurface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    'الحالة الحالية: ${summary.isDarkMode ? "الوضع الليلي" : "الوضع النهاري"} • سجل البحث: ${summary.recentSearchQueries.length} عنصر',
                    style: TextStyle(fontSize: 12.5, color: AppColors.textPrimary),
                  ),
                ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                key: const Key('backup_export_btn'),
                onPressed: _busy ? null : _handleExport,
                icon: const Icon(Icons.copy_rounded, size: 18),
                label: const Text('نسخ النسخة الاحتياطية (JSON)'),
              ),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'استعادة نسخة احتياطية:',
                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                  ),
                  TextButton.icon(
                    onPressed: _busy ? null : _handlePaste,
                    icon: const Icon(Icons.content_paste_rounded, size: 16),
                    label: const Text('لصق'),
                  ),
                ],
              ),
              TextField(
                key: const Key('backup_restore_input'),
                controller: _restoreController,
                maxLines: 4,
                textDirection: TextDirection.ltr,
                style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                decoration: InputDecoration(
                  hintText: '{"schema_version": 1, ...}',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.all(10),
                ),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                key: const Key('backup_restore_submit_btn'),
                onPressed: _busy ? null : _handleRestore,
                icon: const Icon(Icons.restore_rounded, size: 18),
                label: const Text('استعادة التفضيلات'),
              ),
              if (_statusMessage != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _isError
                        ? Colors.red.withOpacity(0.12)
                        : Colors.green.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _statusMessage!,
                    style: TextStyle(
                      fontSize: 12.5,
                      color: _isError ? Colors.red.shade400 : Colors.green.shade400,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }
}
