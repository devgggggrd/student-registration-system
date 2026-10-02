import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { AdminAuditLog } from '../../types';
import { Activity, Search } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(100);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAuditLogs(limit);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      (log.user?.email && log.user.email.toLowerCase().includes(term)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System Security & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            บันทึกประวัติการทำธุรกรรมและการเข้าใช้งานระบบทั้งหมด (Audit Logs) เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">จำนวนที่แสดง:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value={50}>50 รายการล่าสุด</option>
            <option value={100}>100 รายการล่าสุด</option>
            <option value={200}>200 รายการล่าสุด</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา Action, Entity, ผู้ใช้งาน หรือ IP..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
          />
        </div>

        <span className="text-xs text-slate-500">
          พบ <span className="font-bold text-slate-800">{filteredLogs.length}</span> รายการ
        </span>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">ไม่พบบันทึกประวัติที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">วันและเวลาที่บันทึก</th>
                  <th className="px-4 py-3">การกระทำ (Action)</th>
                  <th className="px-4 py-3">เอนทิตี (Entity)</th>
                  <th className="px-4 py-3">ผู้กระทำ (User)</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">รายละเอียด (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-[11px] px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-700 text-[11px]">
                        {log.user?.email || 'ระบบอัตโนมัติ (System)'}
                      </div>
                      {log.user?.role && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          [{log.user.role}]
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 max-w-sm truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
