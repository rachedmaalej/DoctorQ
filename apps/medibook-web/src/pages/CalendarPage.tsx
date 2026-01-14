import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import api from '../lib/api';
import { Appointment, Doctor, ApiResponse } from '../types';
import AppointmentModal from '../components/appointments/AppointmentModal';
import AppointmentDetails from '../components/appointments/AppointmentDetails';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    appointment: Appointment;
  };
}

const statusColors: Record<string, string> = {
  SCHEDULED: '#6366f1',
  CONFIRMED: '#0d9488',
  CHECKED_IN: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  NO_SHOW: '#6b7280',
};

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const calendarRef = useRef<FullCalendar>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Fetch appointments and doctors on mount
  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.getDoctors() as ApiResponse<Doctor[]>;
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchAppointments = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (start) params.from = start;
      if (end) params.to = end;
      if (selectedDoctor) params.doctorId = selectedDoctor;

      const response = await api.getAppointments(params) as ApiResponse<Appointment[]>;
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert appointments to FullCalendar events
  const events: CalendarEvent[] = appointments.map((apt) => ({
    id: apt.id,
    title: apt.patient?.name || 'Patient',
    start: apt.startTime,
    end: apt.endTime,
    backgroundColor: apt.doctor?.color || statusColors[apt.status],
    borderColor: apt.doctor?.color || statusColors[apt.status],
    extendedProps: { appointment: apt },
  }));

  // Handle date range change
  const handleDatesSet = (arg: { startStr: string; endStr: string }) => {
    fetchAppointments(arg.startStr.split('T')[0], arg.endStr.split('T')[0]);
  };

  // Handle date selection (create new appointment)
  const handleDateSelect = (arg: DateSelectArg) => {
    const date = arg.startStr.split('T')[0];
    const time = arg.startStr.includes('T')
      ? arg.startStr.split('T')[1].substring(0, 5)
      : '09:00';

    setSelectedDate(date);
    setSelectedTime(time);
    setSelectedAppointment(null);
    setShowCreateModal(true);
  };

  // Handle event click (view appointment)
  const handleEventClick = (arg: EventClickArg) => {
    const appointment = arg.event.extendedProps.appointment as Appointment;
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  // Handle appointment creation/update
  const handleAppointmentSaved = () => {
    setShowCreateModal(false);
    setShowDetailsModal(false);
    fetchAppointments();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Doctor filter */}
          <select
            value={selectedDoctor}
            onChange={(e) => {
              setSelectedDoctor(e.target.value);
              setTimeout(() => fetchAppointments(), 0);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('doctor.title')}: {t('common.all') || 'Tous'}</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setSelectedTime('09:00');
            setSelectedAppointment(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          {t('calendar.newAppointment')}
        </button>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-xl shadow-sm p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale={i18n.language}
          direction={i18n.language === 'ar' ? 'rtl' : 'ltr'}
          firstDay={1}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:15:00"
          allDaySlot={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          loading={(isLoading) => setLoading(isLoading)}
          buttonText={{
            today: t('calendar.today'),
            month: t('calendar.month'),
            week: t('calendar.week'),
            day: t('calendar.day'),
          }}
          eventContent={(eventInfo) => (
            <div className="p-1 overflow-hidden">
              <div className="font-medium text-xs truncate">
                {eventInfo.event.title}
              </div>
              <div className="text-xs opacity-80 truncate">
                {eventInfo.event.extendedProps.appointment.doctor?.name}
              </div>
            </div>
          )}
        />
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <span className="material-symbols-outlined animate-spin text-primary-500">
              progress_activity
            </span>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          defaultDate={selectedDate}
          defaultTime={selectedTime}
          doctors={doctors}
          onClose={() => setShowCreateModal(false)}
          onSaved={handleAppointmentSaved}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={() => setShowDetailsModal(false)}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowCreateModal(true);
          }}
          onStatusChange={handleAppointmentSaved}
        />
      )}
    </div>
  );
}
