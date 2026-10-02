import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import type { TimetableSlot, DayOfWeek } from '../../types';
import { Calendar, Clock, MapPin, User, BookOpen, Printer } from 'lucide-react';

const DAYS: { key: DayOfWeek; label: string; color: string }[] = [
  { key: 'MONDAY', label: 'วันจันทร์ (Monday)', color: 'border-amber-400 bg-amber-50/80 text-amber-900' },
  { key: 'TUESDAY', label: 'วันอังคาร (Tuesday)', color: 'border-pink-400 bg-pink-50/80 text-pink-900' },
  { key: 'WEDNESDAY', label: 'วันพุธ (Wednesday)', color: 'border-emerald-400 bg-emerald-50/80 text-emerald-900' },
  { key: 'THURSDAY', label: 'วันพฤหัสบดี (Thursday)', color: 'border-orange-400 bg-orange-50/80 text-orange-900' },
  { key: 'FRIDAY', label: 'วันศุกร์ (Friday)', color: 'border-blue-400 bg-blue-50/80 text-blue-900' },
  { key: 'SATURDAY', label: 'วันเสาร์ (Saturday)', color: 'border-purple-400 bg-purple-50/80 text-purple-900' },
  { key: 'SUNDAY', label: 'วันอาทิตย์ (Sunday)', color: 'border-rose-400 bg-rose-50/80 text-rose-900' },
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Weekly Class Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {semester
              ? `ภาคการศึกษา ${semester.semesterNumber}/${semester.academicYear} • ตารางเรียนรายสัปดาห์ตามวันและเวลา`
              : 'ตารางเรียนรายสัปดาห์'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>พิมพ์ตารางเรียน</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">ไม่มีตารางเรียน</p>
          <p className="text-xs text-slate-500 mt-1">
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
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Day Header */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      {day.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {daySlots.length} รายวิชา
                    </span>
                  </div>

                  {/* Class list for this day */}
                  <div className="p-3.5 flex-1 space-y-2.5">
                    {daySlots.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 italic">
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
                            <span className="text-[11px] font-semibold px-2 py-0.5 bg-white/70 rounded-md">
                              กลุ่ม {slot.sectionNumber}
                            </span>
                          </div>

                          <p className="font-semibold text-xs mt-1 line-clamp-1">
                            {slot.courseName}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-black/5 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 opacity-70 shrink-0" />
                              <span>
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 opacity-70 shrink-0" />
                              <span>ห้องเรียน: {slot.room}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 opacity-70 shrink-0" />
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mt-6">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Full Schedule Overview</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">วัน</th>
                    <th className="px-4 py-3">เวลาเรียน</th>
                    <th className="px-4 py-3">รหัสและชื่อวิชา</th>
                    <th className="px-4 py-3">กลุ่มเรียน</th>
                    <th className="px-4 py-3">ห้องเรียน</th>
                    <th className="px-4 py-3">อาจารย์ผู้สอน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slots.map((slot, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {DAY_TH_MAP[slot.dayOfWeek] || slot.dayOfWeek}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-indigo-600">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 mr-1.5">
                          {slot.courseCode}
                        </span>
                        <span className="text-slate-600">{slot.courseName}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        กลุ่ม {slot.sectionNumber} ({slot.credits} นก.)
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {slot.room}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
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
