import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  ScrollView,
  Switch,
  BlurView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as SleepReminderService from '../utils/sleepReminderService';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SleepReminderModal = ({ visible, onClose }) => {
  // State for reminder settings
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]); // Default to every day
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing settings when modal opens
  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  // Load existing settings from AsyncStorage
  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await SleepReminderService.getSleepReminderSettings();
      
      setIsEnabled(settings.enabled);
      
      // Parse the time string (HH:MM) to Date object
      if (settings.time) {
        const [hours, minutes] = settings.time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        setSelectedTime(date);
      }
      
      setSelectedDays(settings.days);
    } catch (error) {
      console.error('Error loading sleep reminder settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle time change from picker
  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  // Toggle day selection
  const toggleDay = (dayIndex) => {
    setSelectedDays(prevDays => {
      if (prevDays.includes(dayIndex)) {
        return prevDays.filter(day => day !== dayIndex);
      } else {
        return [...prevDays, dayIndex].sort((a, b) => a - b);
      }
    });
  };

  // Format time for display
  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutes} ${ampm}`;
  };

  // Format time for storage (24-hour format)
  const formatTimeForStorage = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      if (isEnabled) {
        // Schedule the reminder
        await SleepReminderService.scheduleSleepReminder(
          formatTimeForStorage(selectedTime),
          selectedDays
        );
      } else {
        // Cancel all reminders
        await SleepReminderService.cancelAllSleepReminders();
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error saving sleep reminder settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Send a test notification
  const testNotification = async () => {
    try {
      await SleepReminderService.sendTestNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  // Debug scheduled notifications
  const debugNotifications = async () => {
    try {
      await SleepReminderService.debugScheduledNotifications();
    } catch (error) {
      console.error('Error debugging notifications:', error);
    }
  };

  // Render day selection buttons
  const renderDayButtons = () => {
    return DAYS.map((day, index) => (
      <TouchableOpacity
        key={day}
        style={[
          styles.dayButton,
          selectedDays.includes(index) && styles.selectedDayButton
        ]}
        onPress={() => toggleDay(index)}
        disabled={!isEnabled}
      >
        <Text style={[
          styles.dayButtonText,
          selectedDays.includes(index) && styles.selectedDayButtonText,
          !isEnabled && styles.disabledText
        ]}>
          {day}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(200, 220, 255, 0.8)']}
          style={styles.modalView}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Sleep Reminder</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#0D47A1" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0D47A1" style={styles.loader} />
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Enable/Disable Switch */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Enable Sleep Reminder</Text>
                <Switch
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={isEnabled ? '#0D47A1' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={setIsEnabled}
                  value={isEnabled}
                />
              </View>

              {/* Time Picker */}
              <View style={[styles.section, !isEnabled && styles.disabledSection]}>
                <Text style={[styles.sectionTitle, !isEnabled && styles.disabledText]}>Reminder Time</Text>
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                  disabled={!isEnabled}
                >
                  <Text style={[styles.timeText, !isEnabled && styles.disabledText]}>
                    {formatTime(selectedTime)}
                  </Text>
                  <Ionicons name="time-outline" size={24} color={isEnabled ? '#0D47A1' : '#ccc'} />
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                )}
              </View>

              {/* Day Selection */}
              <View style={[styles.section, !isEnabled && styles.disabledSection]}>
                <Text style={[styles.sectionTitle, !isEnabled && styles.disabledText]}>Repeat on days</Text>
                <View style={styles.daysContainer}>
                  {renderDayButtons()}
                </View>
              </View>

              {/* Action Buttons */}
              {isEnabled && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.testButton, styles.halfWidthButton]}
                    onPress={testNotification}
                  >
                    <Text style={styles.testButtonText}>Test</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.debugButton, styles.halfWidthButton]}
                    onPress={debugNotifications}
                  >
                    <Text style={styles.debugButtonText}>Debug</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveSettings}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Settings</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    // Glass effect
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 71, 161, 0.2)',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loader: {
    marginVertical: 30,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D47A1',
  },
  section: {
    marginBottom: 20,
  },
  disabledSection: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D47A1',
    marginBottom: 10,
  },
  timePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(13, 71, 161, 0.2)',
  },
  timeText: {
    fontSize: 18,
    color: '#0D47A1',
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(13, 71, 161, 0.2)',
    marginBottom: 10,
  },
  selectedDayButton: {
    backgroundColor: '#0D47A1',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#0D47A1',
    fontWeight: '500',
  },
  selectedDayButtonText: {
    color: '#fff',
  },
  disabledText: {
    color: '#999',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidthButton: {
    width: '48%',
  },
  testButton: {
    backgroundColor: 'rgba(13, 71, 161, 0.1)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 71, 161, 0.2)',
  },
  testButtonText: {
    color: '#0D47A1',
    fontWeight: '500',
  },
  debugButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  debugButtonText: {
    color: '#FF9800',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0D47A1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SleepReminderModal;