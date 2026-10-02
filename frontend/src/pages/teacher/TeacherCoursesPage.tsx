import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import type { TeacherSection, TeacherSectionRoster } from '../../types';
import {
  BookOpen,
  Users,
  Clock,
  MapPin,
  Search,
  Printer,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const DAY_TH_MAP: Record<string, string> = {
  MONDAY: 'จันทร์',
  TUESDAY: 'อังคาร',
  WEDNESDAY: 'พุธ',
  THURSDAY: 'พฤหัสบดี',
  FRIDAY: 'ศุกร์',
  SATURDAY: 'เสาร์',
  SUNDAY: 'อาทิตย์',
};

export const TeacherCoursesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    searchParams.get('sectionId') || null,
  );

  // Roster Modal States
  const [rosterData, setRosterData] = useState<TeacherSectionRoster | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'ALL' | 'REGISTERED' | 'DROPPED'>('ALL');

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoading(true);
        const data = await teacherService.getSections();
        setSections(data);
      } catch (err) {
        console.error('Failed to load teacher sections', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSections();
  }, []);

  // When selectedSectionId changes, load roster
  useEffect(() => {
    if (!selectedSectionId) {
      setRosterData(null);
      return;
    }

    const loadRoster = async () => {
      try {
        setRosterLoading(true);
        const data = await teacherService.getSectionRoster(selectedSectionId);
        setRosterData(data);
      } catch (err) {
        console.error('Failed to load roster', err);
      } finally {
        setRosterLoading(false);
      }
    };
    loadRoster();
  }, [selectedSectionId]);

  const filteredSections = sections.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.course.courseCode.toLowerCase().includes(term) ||
      s.course.courseName.toLowerCase().includes(term) ||
      s.room.toLowerCase().includes(term)
    );
  });

  const filteredRosterStudents = rosterData?.students.filter((s) => {
    const matchesSearch =
      s.student.studentCode.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      s.student.firstName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      s.student.lastName.toLowerCase().includes(rosterSearch.toLowerCase());

    const matchesStatus =
      rosterStatusFilter === 'ALL' || s.status === rosterStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const handlePrintRoster = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Teaching Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            รายชื่อวิชาและกลุ่มเรียนที่รับผิดชอบการสอนในภาคการศึกษาปัจจุบัน พร้อมตรวจสอบรายชื่อนักศึกษา
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหารหัสวิชา หรือชื่อวิชา..."
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-slate-800"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-semibold text-slate-700">ไม่พบกลุ่มเรียนที่ค้นหา</p>
          <p className="text-xs text-slate-500 mt-1">
            ลองปรับเปลี่ยนคำค้นหาใหม่อีกครั้ง
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSections.map((sec) => {
            const percent = Math.round((sec.enrolledCount / sec.capacity) * 100);

            return (
              <div
                key={sec.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-purple-200 transition-all"
              >
                {/* Header Strip */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-purple-700">
                    {sec.course.courseCode}
                  </span>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg">
                    กลุ่ม {sec.sectionNumber}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {sec.course.courseName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {sec.course.credits} หน่วยกิต • {sec.course.department}
                    </p>

                    {/* Schedule Badges */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {sec.schedules.length > 0
                            ? sec.schedules
                                .map(
                                  (s) =>
                                    `${DAY_TH_MAP[s.dayOfWeek] || s.dayOfWeek} ${s.startTime}-${s.endTime}`,
                                )
                                .join(', ')
                            : 'ออนไลน์ / รอประกาศ'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>ห้องเรียน: {sec.room}</span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Bar & Action */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">ที่นั่งที่ลงทะเบียนแล้ว</span>
                      <span className="font-bold text-slate-800">
                        {sec.enrolledCount} / {sec.capacity} คน ({percent}%)
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full ${
                          percent >= 100
                            ? 'bg-red-500'
                            : percent >= 80
                            ? 'bg-amber-500'
                            : 'bg-purple-600'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    <button
                      onClick={() => setSelectedSectionId(sec.id)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>ดูรายชื่อนักศึกษา</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Roster Modal / Slide-over */}
      {selectedSectionId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Student Enrollment Roster
                  </h2>
                  {rosterData && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-md">
                      {rosterData.section.course.courseCode} กลุ่ม {rosterData.section.sectionNumber}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rosterData?.section.course.courseName} • ห้องเรียน: {rosterData?.section.room}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintRoster}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">พิมพ์รายชื่อ</span>
                </button>
                <button
                  onClick={() => setSelectedSectionId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {rosterLoading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : !rosterData ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  ไม่พบข้อมูลรายชื่อนักศึกษา
                </div>
              ) : (
                <>
                  {/* Summary & Filters Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                      <div>
                        นักศึกษาที่ลงทะเบียน:{' '}
                        <span className="font-bold text-purple-700">
                          {rosterData.stats.totalActive} คน
                        </span>
                      </div>
                      <div className="text-slate-300">|</div>
                      <div>
                        ที่นั่งคงเหลือ:{' '}
                        <span className="font-bold text-emerald-600">
                          {rosterData.section.remainingSeats} ที่
                        </span>
                      </div>
                      <div className="text-slate-300">|</div>
                      <div>
                        ถอนรายวิชา:{' '}
                        <span className="font-bold text-slate-500">
                          {rosterData.stats.totalDropped} คน
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={rosterSearch}
                          onChange={(e) => setRosterSearch(e.target.value)}
                          placeholder="ค้นหารหัส/ชื่อ..."
                          className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 w-36 sm:w-44"
                        />
                      </div>

                      <select
                        value={rosterStatusFilter}
                        onChange={(e: any) => setRosterStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="ALL">สถานะทั้งหมด</option>
                        <option value="REGISTERED">ลงทะเบียนปกติ</option>
                        <option value="DROPPED">ถอนรายวิชา</option>
                      </select>
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5 text-center w-12">ลำดับ</th>
                          <th className="px-3.5 py-2.5">รหัสนักศึกษา</th>
                          <th className="px-3.5 py-2.5">ชื่อ-นามสกุล</th>
                          <th className="px-3.5 py-2.5">ภาควิชา</th>
                          <th className="px-3.5 py-2.5 text-center">ชั้นปี</th>
                          <th className="px-3.5 py-2.5">อีเมลติดต่อ</th>
                          <th className="px-3.5 py-2.5">วันที่ลงทะเบียน</th>
                          <th className="px-3.5 py-2.5 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRosterStudents && filteredRosterStudents.length > 0 ? (
                          filteredRosterStudents.map((item, idx) => (
                            <tr key={item.enrollmentId} className="hover:bg-slate-50/70">
                              <td className="px-3.5 py-2.5 text-center font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                                {item.student.studentCode}
                              </td>
                              <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                                {item.student.firstName} {item.student.lastName}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600">
                                {item.student.department}
                              </td>
                              <td className="px-3.5 py-2.5 text-center font-medium text-slate-700">
                                ปี {item.student.yearLevel}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px]">
                                {item.student.email}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                                {new Date(item.registeredAt).toLocaleDateString('th-TH', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-3.5 py-2.5 text-center">
                                {item.status === 'REGISTERED' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    ปกติ
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                    <AlertCircle className="w-3 h-3" />
                                    ถอนแล้ว
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                              ไม่พบรายชื่อนักศึกษาที่ตรงกับเงื่อนไข
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSectionId(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
