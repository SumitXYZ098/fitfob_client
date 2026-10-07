import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// -------------------------------------------------------------
// Constants & Helper Functions
// -------------------------------------------------------------

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const formatDateDisplay = (date: Date): string => {
  const d = padZero(date.getDate());
  const m = padZero(date.getMonth() + 1);
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

export const formatDatePretty = (date: Date): string => {
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const monthName = MONTH_NAMES_SHORT[date.getMonth()];
  return `${dayName}, ${date.getDate()} ${monthName} ${date.getFullYear()}`;
};

const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const isSameDay = (d1?: Date | null, d2?: Date | null): boolean => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    Haptics.impactAsync(style);
  } catch {
    // Graceful fallback if haptics unavailable
  }
};

// -------------------------------------------------------------
// CustomCalendar (Inline Calendar Component)
// -------------------------------------------------------------

export interface CustomCalendarProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  primaryColor?: string;
  showTodayButton?: boolean;
}

type ViewMode = 'days' | 'months' | 'years';

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  primaryColor = '#F6163C',
  showTodayButton = true,
}) => {
  const initialDate = value || (maxDate && maxDate < new Date() ? maxDate : new Date());

  const [viewDate, setViewDate] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [viewMode, setViewMode] = useState<ViewMode>('days');

  const yearScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setViewDate(value);
    }
  }, [value]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const minYear = minDate ? minDate.getFullYear() : 1920;
  const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 25;

  const yearsList = useMemo(() => {
    const list: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Auto scroll to current year in years view
  useEffect(() => {
    if (viewMode === 'years' && yearScrollViewRef.current) {
      const targetIndex = yearsList.indexOf(currentYear);
      if (targetIndex >= 0) {
        const rowIndex = Math.floor(targetIndex / 3);
        setTimeout(() => {
          yearScrollViewRef.current?.scrollTo({
            y: Math.max(0, rowIndex * 52 - 50),
            animated: true,
          });
        }, 80);
      }
    }
  }, [viewMode, currentYear, yearsList]);

  // Navigate months
  const handlePrevMonth = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const prev = new Date(currentYear, currentMonth - 1, 1);
    if (minDate) {
      const minMonthDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      if (prev < minMonthDate) return;
    }
    setViewDate(prev);
  };

  const handleNextMonth = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    const next = new Date(currentYear, currentMonth + 1, 1);
    if (maxDate) {
      const maxMonthDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      if (next > maxMonthDate) return;
    }
    setViewDate(next);
  };

  const isPrevMonthDisabled = useMemo(() => {
    if (!minDate) return false;
    const prev = new Date(currentYear, currentMonth - 1, 1);
    const minMonthDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    return prev < minMonthDate;
  }, [currentYear, currentMonth, minDate]);

  const isNextMonthDisabled = useMemo(() => {
    if (!maxDate) return false;
    const next = new Date(currentYear, currentMonth + 1, 1);
    const maxMonthDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    return next > maxMonthDate;
  }, [currentYear, currentMonth, maxDate]);

  // Select day
  const handleDayPress = (dayDate: Date) => {
    if (isDateDisabled(dayDate)) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDate(dayDate);
    onChange?.(dayDate);
  };

  // Select month
  const handleMonthPress = (mIndex: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setViewDate(new Date(currentYear, mIndex, 1));
    setViewMode('days');
  };

  // Select year
  const handleYearPress = (year: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setViewDate(new Date(year, currentMonth, 1));
    setViewMode('months');
  };

  // Check if a date is disabled
  const isDateDisabled = (targetDate: Date): boolean => {
    const target = startOfDay(targetDate).getTime();
    if (minDate && target < startOfDay(minDate).getTime()) return true;
    if (maxDate && target > startOfDay(maxDate).getTime()) return true;
    return false;
  };

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun, 6 is Sat
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Previous month padding days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        date: new Date(currentYear, currentMonth, d),
        isCurrentMonth: true,
      });
    }

    // Next month padding to complete the last row
    const remainder = days.length % 7;
    if (remainder !== 0) {
      const remainingSlots = 7 - remainder;
      for (let n = 1; n <= remainingSlots; n++) {
        days.push({
          date: new Date(currentYear, currentMonth + 1, n),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  const today = new Date();
  const isTodayDisabled = isDateDisabled(today);

  return (
    <View style={styles.calendarContainer}>
      {/* --- CALENDAR HEADER --- */}
      <View style={styles.headerRow}>
        {/* Previous Button */}
        <TouchableOpacity
          onPress={handlePrevMonth}
          disabled={isPrevMonthDisabled || viewMode !== 'days'}
          activeOpacity={0.7}
          style={[
            styles.navArrowButton,
            (isPrevMonthDisabled || viewMode !== 'days') && styles.disabledNavArrow,
          ]}>
          <Ionicons name="chevron-back" size={20} color="#334155" />
        </TouchableOpacity>

        {/* Month & Year Selectors */}
        <View style={styles.selectorPillsRow}>
          {/* Month Pill */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setViewMode(viewMode === 'months' ? 'days' : 'months');
            }}
            activeOpacity={0.8}
            style={[
              styles.selectorPill,
              viewMode === 'months' && styles.selectorPillActive,
            ]}>
            <Text
              style={[
                styles.selectorPillText,
                viewMode === 'months' && { color: primaryColor },
              ]}>
              {MONTH_NAMES[currentMonth]}
            </Text>
            <Ionicons
              name={viewMode === 'months' ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={viewMode === 'months' ? primaryColor : '#64748b'}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Year Pill */}
          <TouchableOpacity
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setViewMode(viewMode === 'years' ? 'days' : 'years');
            }}
            activeOpacity={0.8}
            style={[
              styles.selectorPill,
              viewMode === 'years' && styles.selectorPillActive,
            ]}>
            <Text
              style={[
                styles.selectorPillText,
                viewMode === 'years' && { color: primaryColor },
              ]}>
              {currentYear}
            </Text>
            <Ionicons
              name={viewMode === 'years' ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={viewMode === 'years' ? primaryColor : '#64748b'}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={handleNextMonth}
          disabled={isNextMonthDisabled || viewMode !== 'days'}
          activeOpacity={0.7}
          style={[
            styles.navArrowButton,
            (isNextMonthDisabled || viewMode !== 'days') && styles.disabledNavArrow,
          ]}>
          <Ionicons name="chevron-forward" size={20} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* --- DAYS VIEW --- */}
      {viewMode === 'days' && (
        <View style={styles.daysViewContainer}>
          {/* Weekday Names Header (Strict 7 columns) */}
          <View style={styles.weekdaysRow}>
            {WEEKDAY_NAMES.map((wd, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{wd}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid (Strict 7 columns per row) */}
          <View style={styles.daysGrid}>
            {calendarDays.map((item, index) => {
              const disabled = isDateDisabled(item.date);
              const selected = isSameDay(item.date, selectedDate);
              const isToday = isSameDay(item.date, today);

              return (
                <View key={index} style={styles.dayCell}>
                  <TouchableOpacity
                    onPress={() => handleDayPress(item.date)}
                    disabled={disabled}
                    activeOpacity={0.7}
                    style={[
                      styles.dayButton,
                      isToday && !selected && styles.todayButton,
                      selected && { backgroundColor: primaryColor },
                      disabled && styles.disabledDay,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        !item.isCurrentMonth && styles.otherMonthText,
                        isToday && !selected && styles.todayText,
                        selected && styles.selectedDayText,
                      ]}>
                      {item.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* --- MONTHS VIEW --- */}
      {viewMode === 'months' && (
        <View style={styles.monthsViewContainer}>
          <Text style={styles.gridHintText}>Select a Month for {currentYear}</Text>
          <View style={styles.monthsGrid}>
            {MONTH_NAMES_SHORT.map((name, index) => {
              const isSelectedMonth = index === currentMonth;
              const monthDate = new Date(currentYear, index, 1);
              const isMonthDisabled =
                (minDate && monthDate < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) ||
                (maxDate && monthDate > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1));

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleMonthPress(index)}
                  disabled={isMonthDisabled}
                  activeOpacity={0.7}
                  style={[
                    styles.monthButton,
                    isSelectedMonth && { backgroundColor: primaryColor, borderColor: primaryColor },
                    isMonthDisabled && styles.disabledGridItem,
                  ]}>
                  <Text
                    style={[
                      styles.monthButtonText,
                      isSelectedMonth && styles.selectedGridItemText,
                    ]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* --- YEARS VIEW (ScrollView - immune to out-of-range errors) --- */}
      {viewMode === 'years' && (
        <View style={styles.yearsViewContainer}>
          <Text style={styles.gridHintText}>Scroll and select a Year</Text>
          <ScrollView
            ref={yearScrollViewRef}
            style={styles.yearsScrollView}
            contentContainerStyle={styles.yearsGrid}
            showsVerticalScrollIndicator={false}>
            {yearsList.map((yr) => {
              const isSelectedYear = yr === currentYear;
              return (
                <TouchableOpacity
                  key={yr}
                  onPress={() => handleYearPress(yr)}
                  activeOpacity={0.7}
                  style={[
                    styles.yearButton,
                    isSelectedYear && { backgroundColor: primaryColor, borderColor: primaryColor },
                  ]}>
                  <Text
                    style={[
                      styles.yearButtonText,
                      isSelectedYear && styles.selectedGridItemText,
                    ]}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* --- FOOTER: TODAY JUMP BUTTON --- */}
      {showTodayButton && viewMode === 'days' && !isTodayDisabled && (
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setViewDate(today);
              setSelectedDate(today);
              onChange?.(today);
            }}
            style={styles.todayJumpButton}>
            <Ionicons name="today-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={styles.todayJumpButtonText}>Jump to Today</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// -------------------------------------------------------------
// CustomCalendarModal (Global Modal Picker)
// -------------------------------------------------------------

export interface CustomCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  value?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  primaryColor?: string;
}

export const CustomCalendarModal: React.FC<CustomCalendarModalProps> = ({
  visible,
  onClose,
  onConfirm,
  value,
  minDate,
  maxDate,
  title = 'Select Date',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  primaryColor = '#F6163C',
}) => {
  const [tempDate, setTempDate] = useState<Date>(
    value || (maxDate && maxDate < new Date() ? maxDate : new Date())
  );

  useEffect(() => {
    if (visible) {
      setTempDate(value || (maxDate && maxDate < new Date() ? maxDate : new Date()));
    }
  }, [visible, value, maxDate]);

  const handleConfirm = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(tempDate);
  };

  const handleCancel = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />

        <View style={styles.modalSheet}>
          {/* Top Sheet Handle */}
          <View style={styles.modalHandle} />

          {/* Modal Header */}
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitleText}>{title}</Text>
              <Text style={styles.modalSubtitleText}>
                {tempDate ? formatDatePretty(tempDate) : 'Select a date from calendar'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              style={styles.modalCloseButton}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Selected Date Badge */}
          <View style={styles.selectedDateBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.calendarBadgeIcon}>
                <Ionicons name="calendar" size={18} color="#F6163C" />
              </View>
              <View>
                <Text style={styles.badgeLabelText}>Selected Date</Text>
                <Text style={styles.badgeDateText}>
                  {formatDateDisplay(tempDate)}
                </Text>
              </View>
            </View>
            <Text style={styles.badgeDayNameText}>
              {formatDatePretty(tempDate).split(',')[0]}
            </Text>
          </View>

          {/* Calendar */}
          <CustomCalendar
            value={tempDate}
            onChange={(d) => setTempDate(d)}
            minDate={minDate}
            maxDate={maxDate}
            primaryColor={primaryColor}
            showTodayButton
          />

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.8}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.8}
              style={[styles.confirmButton, { backgroundColor: primaryColor }]}>
              <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// -------------------------------------------------------------
// CustomDatePicker (All-In-One Input + Modal Component)
// -------------------------------------------------------------

export interface CustomDatePickerProps {
  label?: string;
  value?: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  title?: string;
  disabled?: boolean;
  containerClassName?: string;
  error?: string;
  primaryColor?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  minDate,
  maxDate,
  title = 'Select Date',
  disabled = false,
  containerClassName = '',
  error,
  primaryColor = '#F6163C',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayText = value ? formatDateDisplay(value) : placeholder;
  const isSelected = Boolean(value);

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && <Text className="mb-2 font-medium text-slate-500">{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
          setIsModalOpen(true);
        }}
        className={`h-16 flex-row items-center justify-between rounded-2xl border px-5 bg-white ${
          error
            ? 'border-red-400 bg-red-50/10'
            : isModalOpen
            ? 'border-[#F6163C]'
            : 'border-slate-200'
        } ${disabled ? 'opacity-50' : ''}`}>
        <Text
          className={`font-medium text-lg ${
            isSelected ? 'text-slate-800' : 'text-slate-300'
          }`}>
          {displayText}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={22}
          color={isModalOpen ? primaryColor : '#94a3b8'}
        />
      </TouchableOpacity>

      {error && <Text className="mt-1 text-xs text-red-500 font-medium">{error}</Text>}

      <CustomCalendarModal
        visible={isModalOpen}
        value={value}
        minDate={minDate}
        maxDate={maxDate}
        title={title}
        primaryColor={primaryColor}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(newDate) => {
          setIsModalOpen(false);
          onChange(newDate);
        }}
      />
    </View>
  );
};

export default CustomCalendar;

// -------------------------------------------------------------
// Pure React Native Stylesheet (Eliminates CSS-interop race conditions)
// -------------------------------------------------------------

const styles = StyleSheet.create({
  calendarContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledNavArrow: {
    opacity: 0.25,
  },
  selectorPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectorPillActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#F6163C',
  },
  selectorPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  daysViewContainer: {
    width: '100%',
  },
  weekdaysRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 0,
  },
  weekdayCell: {
    width: '14.2857%', // Exact 1/7th width for perfect 7-column layout
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: '14.2857%', // Exact 1/7th width for perfect day-to-weekday alignment
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButton: {
    borderWidth: 1.5,
    borderColor: '#F6163C',
    backgroundColor: '#FFF1F2',
  },
  disabledDay: {
    opacity: 0.2,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  otherMonthText: {
    color: '#cbd5e1',
  },
  todayText: {
    fontWeight: '700',
    color: '#F6163C',
  },
  selectedDayText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  monthsViewContainer: {
    paddingVertical: 8,
  },
  gridHintText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 12,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: '31%',
    paddingVertical: 12,
    marginVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  yearsViewContainer: {
    height: 250,
    paddingVertical: 8,
  },
  yearsScrollView: {
    flex: 1,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  yearButton: {
    width: '31%',
    paddingVertical: 12,
    marginVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  disabledGridItem: {
    opacity: 0.25,
  },
  selectedGridItemText: {
    color: '#ffffff',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  todayJumpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  todayJumpButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalSheet: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  calendarBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(246, 22, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  badgeDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeDayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F6163C',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
