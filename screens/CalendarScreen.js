// CalendarScreen - Calendar view for projects and events
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOWS  } from '../theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDatePress = (day) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(day);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        day === today.getDate() && 
        currentMonth === today.getMonth() && 
        currentYear === today.getFullYear();
      const isSelected = day === selectedDate;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            isSelected && styles.selectedCell,
          ]}
          onPress={() => handleDatePress(day)}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            isSelected && styles.selectedText,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Month/Year Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.monthYearText}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            {DAYS.map(day => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar days */}
          <View style={styles.daysGrid}>
            {renderCalendar()}
          </View>
        </View>

        {/* Events section (placeholder) */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Events</Text>
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.tertiaryLabel} />
            <Text style={styles.emptyText}>No events scheduled</Text>
            <Text style={styles.emptySubtext}>
              Project milestones and deadlines will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DAY_CELL_WIDTH = 100 / 7;

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: colors.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline,
    color: colors.label,
  },
  todayButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  todayButtonText: {
    ...TYPOGRAPHY.body,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  monthButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    ...TYPOGRAPHY.title2,
    color: colors.label,
  },
  calendarCard: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  dayHeaderText: {
    ...TYPOGRAPHY.caption1,
    color: colors.secondaryLabel,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${DAY_CELL_WIDTH}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
  },
  todayCell: {
    backgroundColor: colors.primary + '20',
    borderRadius: RADIUS.sm,
  },
  selectedCell: {
    backgroundColor: colors.primary,
    borderRadius: RADIUS.sm,
  },
  dayText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
  },
  todayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.systemBackground,
    fontWeight: '600',
  },
  eventsSection: {
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: colors.label,
    marginBottom: SPACING.md,
  },
  emptyState: {
    backgroundColor: colors.secondarySystemGroupedBackground,
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: colors.label,
    marginTop: SPACING.sm,
  },
  emptySubtext: {
    ...TYPOGRAPHY.footnote,
    color: colors.secondaryLabel,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
