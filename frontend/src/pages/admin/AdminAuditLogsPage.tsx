import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { AdminAuditLog } from '../../types';
import { Activity, Search, Radio, WifiOff } from 'lucide-react';


export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(100);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [recentId, setRecentId] = useState<string | null>(null);
  const [liveEventsCount, setLiveEventsCount] = useState(0);

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

  // Real-Time Server-Sent Events (SSE) Stream
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    const streamUrl = `${API_BASE_URL}/admin/audit-logs/stream?token=${encodeURIComponent(token)}`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const newLog = JSON.parse(event.data);
          if (newLog && newLog.id) {
            setLogs((prev) => {
              if (prev.some((l) => l.id === newLog.id)) return prev;
              return [newLog, ...prev.slice(0, limit - 1)];
            });
            setRecentId(newLog.id);
            setLiveEventsCount((c) => c + 1);

            // Clear highlight after 3 seconds
            setTimeout(() => {
              setRecentId((curr) => (curr === newLog.id ? null : curr));
            }, 3000);
          }
        } catch (parseErr) {
          console.error('Error parsing SSE event:', parseErr);
        }
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (e) {
      console.error('Failed to initialize EventSource:', e);
      setIsLiveConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              System Security & Audit Trail
            </h1>

            {/* Live Indicator Badge */}
            {isLiveConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                LIVE REAL-TIME STREAM
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <WifiOff className="w-3 h-3 text-slate-400" aria-hidden="true" />
                Connecting Stream...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            บันทึกประวัติการทำธุรกรรมและการเข้าใช้งานระบบทั้งหมด (Audit Logs) สตรีมแบบ Real-Time อัตโนมัติโดยไม่ต้องรีเฟรชหน้าจอ
          </p>
        </div>

        <div className="flex items-center gap-3">
          {liveEventsCount > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" aria-hidden="true" />
              ได้รับ {liveEventsCount} เหตุการณ์ใหม่สดๆ
            </span>
          )}

          <div className="flex items-center gap-2">
            <label htmlFor="audit-limit-select" className="text-xs text-slate-500 dark:text-slate-400">จำนวนที่แสดง:</label>
            <select
              id="audit-limit-select"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="min-h-[38px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={50}>50 รายการล่าสุด</option>
              <option value={100}>100 รายการล่าสุด</option>
              <option value={200}>200 รายการล่าสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="audit-search-input" className="sr-only">
            ค้นหา Action, Entity, ผู้ใช้งาน หรือ IP
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
          <input
            id="audit-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา Action, Entity, ผู้ใช้งาน หรือ IP..."
            className="w-full min-h-[44px] pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            พบ <span className="font-bold text-slate-800 dark:text-slate-200">{filteredLogs.length}</span> รายการ
          </span>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Activity className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" aria-hidden="true" />
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">ไม่พบบันทึกประวัติที่ตรงกับเงื่อนไข</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3">วันและเวลาที่บันทึก</th>
                  <th scope="col" className="px-4 py-3">การกระทำ (Action)</th>
                  <th scope="col" className="px-4 py-3">เอนทิตี (Entity)</th>
                  <th scope="col" className="px-4 py-3">ผู้กระทำ (User)</th>
                  <th scope="col" className="px-4 py-3">IP Address</th>
                  <th scope="col" className="px-4 py-3">รายละเอียด (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const isJustArrived = log.id === recentId;
                  return (
                    <tr
                      key={log.id}
                      className={
                        isJustArrived
                          ? 'bg-amber-100/80 dark:bg-amber-950/60 transition-colors duration-1000 font-semibold'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-200'
                      }
                    >
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isJustArrived && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          )}
                          {new Date(log.createdAt).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-[11px] px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {log.entity}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {log.user?.email || 'ระบบอัตโนมัติ (System)'}
                        </div>
                        {log.user?.role && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            [{log.user.role}]
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                          {log.ipAddress || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 max-w-sm truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
