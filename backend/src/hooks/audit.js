/**
 * src/hooks/audit.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Helper function to write entries to the audit_log table.
 * Call this inside any admin route handler after a write operation.
 *
 * Usage:
 *   import { writeAuditLog } from '../../hooks/audit.js';
 *
 *   await writeAuditLog(fastify, {
 *     adminId:   request.user.sub,
 *     tableName: 'word_mappings',
 *     recordId:  updatedRow.id,
 *     action:    'UPDATE',
 *     oldData:   originalRow,
 *     newData:   updatedRow,
 *   });
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {{ adminId: string, tableName: string, recordId: string,
 *           action: 'INSERT'|'UPDATE'|'DELETE', oldData?: object, newData?: object }} params
 */
export async function writeAuditLog(fastify, { adminId, tableName, recordId, action, oldData, newData }) {
  try {
    const { error } = await fastify.supabase
      .from('audit_log')
      .insert({
        admin_id:   adminId,
        table_name: tableName,
        record_id:  String(recordId),
        action,
        old_data:   oldData  ?? null,
        new_data:   newData  ?? null,
      });

    if (error) {
      // Don't fail the main request — just log the audit failure
      fastify.log.warn(`Audit log write failed: ${error.message}`);
    }
  } catch (err) {
    fastify.log.warn(`Audit log exception: ${err.message}`);
  }
}
