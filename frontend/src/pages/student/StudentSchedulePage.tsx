import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import type { TimetableSlot, DayOfWeek } from '../../types';
import { Calendar, Clock, MapPin, User, BookOpen, Printer } from 'lucide-react';

const DAYS: { key: DayOfWeek; label: string; color: string }[] = [
  { key: 'MONDAY', label: 'วันจันทร์ (Monday)', color: 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200' },
  { key: 'TUESDAY', label: 'วันอังคาร (Tuesday)', color: 'border-pink-400 bg-pink-50/80 dark:bg-pink-950/30 text-pink-900 dark:text-pink-200' },
  { key: 'WEDNESDAY', label: 'วันพุธ (Wednesday)', color: 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200' },
  { key: 'THURSDAY', label: 'วันพฤหัสบดี (Thursday)', color: 'border-orange-400 bg-orange-50/80 dark:bg-orange-950/30 text-orange-900 dark:text-orange-200' },
  { key: 'FRIDAY', label: 'วันศุกร์ (Friday)', color: 'border-blue-400 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200' },
  { key: 'SATURDAY', label: 'วันเสาร์ (Saturday)', color: 'border-purple-400 bg-purple-50/80 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200' },
  { key: 'SUNDAY', label: 'วันอาทิตย์ (Sunday)', color: 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200' },
];

const DAY_TH_MAP: Record<string, string> = {
  MONDAY: 'วันจันทร์',
  TUESDAY: 'วันอังคาร',
  WEDNESDAY: 'วันพุธ',
  THURSDAY: 'วันพฤหัสบดี',
  FRIDAY: 'วันศุกร์',
  SATURDAY: 'วันเสาร์',
  SUNDAY: 'วันอาทิตย์',
};

export const StudentSchedulePage: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [semester, setSemester] = useState<{ academicYear: number; semesterNumber: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setIsLoading(true);
        const res = await studentService.getSchedule();
        setSlots(res.slots);
        setSemester(res.semester);
      } catch (err) {
        console.error('Failed to load timetable', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const activeDays = DAYS.filter((d) =>
    ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(d.key) ||
    slots.some((s) => s.dayOfWeek === d.key),
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Weekly Class Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {semester
              ? `ภาคการศึกษา ${semester.semesterNumber}/${semester.academicYear} • ตารางเรียนรายสัปดาห์ตามวันและเวลา`
              : 'ตารางเรียนรายสัปดาห์'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          aria-label="พิมพ์หรือบันทึกตารางเรียนเป็น PDF"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          <span>พิมพ์ตารางเรียน</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" aria-hidden="true" />
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">ไม่มีตารางเรียน</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ลงทะเบียนรายวิชาเพื่อเริ่มแสดงตารางเรียนประจำสัปดาห์ของคุณ
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Day-by-Day Visual Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDays.map((day) => {
              const daySlots = slots.filter((s) => s.dayOfWeek === day.key);

              return (
                <div
                  key={day.key}
                  className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors"
                >
                  {/* Day Header */}
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {day.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {daySlots.length} รายวิชา
                    </span>
                  </div>

                  {/* Class list for this day */}
                  <div className="p-3.5 flex-1 space-y-2.5">
                    {daySlots.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                        ไม่มีตารางเรียนในวันนี้
                      </div>
                    ) : (
                      daySlots.map((slot, index) => (
                        <div
                          key={`${slot.enrollmentId}-${index}`}
                          className={`p-3.5 rounded-xl border-l-4 shadow-sm transition-transform hover:-translate-y-0.5 ${day.color}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-xs">
                              {slot.courseCode}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 bg-white/70 dark:bg-black/40 rounded-md">
                              กลุ่ม {slot.sectionNumber}
                            </span>
                          </div>

                          <p className="font-semibold text-xs mt-1 line-clamp-1">
                            {slot.courseName}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 opacity-70 shrink-0" aria-hidden="true" />
                              <span>
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 opacity-70 shrink-0" aria-hidden="true" />
                              <span>ห้องเรียน: {slot.room}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 opacity-70 shrink-0" aria-hidden="true" />
                              <span>{slot.teacherName}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Summary Table */}
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 mt-6 transition-colors">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <span>Full Schedule Overview</span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3">วัน</th>
                    <th scope="col" className="px-4 py-3">เวลาเรียน</th>
                    <th scope="col" className="px-4 py-3">รหัสและชื่อวิชา</th>
                    <th scope="col" className="px-4 py-3">กลุ่มเรียน</th>
                    <th scope="col" className="px-4 py-3">ห้องเรียน</th>
                    <th scope="col" className="px-4 py-3">อาจารย์ผู้สอน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {slots.map((slot, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {DAY_TH_MAP[slot.dayOfWeek] || slot.dayOfWeek}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 dark:text-white mr-1.5">
                          {slot.courseCode}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">{slot.courseName}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                        กลุ่ม {slot.sectionNumber} ({slot.credits} นก.)
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {slot.room}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {slot.teacherName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
