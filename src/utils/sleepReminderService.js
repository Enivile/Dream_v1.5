import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const SLEEP_REMINDER_ENABLED_KEY = '@sleep_reminder_enabled';
const SLEEP_REMINDER_TIME_KEY = '@sleep_reminder_time';
const SLEEP_REMINDER_DAYS_KEY = '@sleep_reminder_days';
const SLEEP_REMINDER_ID_KEY = '@sleep_reminder_notification_id';

// Initialize notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Initialize notification channel for Android
 */
export const initializeNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sleep-reminders', {
      name: 'Sleep Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0D47A1',
      sound: 'notification_sound', // Remove .wav extension for Android
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.NOTIFICATION,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
    });
    console.log('Notification channel initialized with custom sound: notification_sound');
  }
};

/**
 * Request notification permissions
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    console.log('Must use physical device for notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return false;
  }

  return true;
};

/**
 * Save sleep reminder settings to AsyncStorage
 * @param {boolean} enabled Whether reminders are enabled
 * @param {string} time Time in format "HH:MM"
 * @param {Array<number>} days Array of days (0-6, where 0 is Sunday)
 * @param {string} notificationId ID of the scheduled notification
 */
export const saveSleepReminderSettings = async (enabled, time, days, notificationId = null) => {
  try {
    await AsyncStorage.setItem(SLEEP_REMINDER_ENABLED_KEY, JSON.stringify(enabled));
    await AsyncStorage.setItem(SLEEP_REMINDER_TIME_KEY, time);
    await AsyncStorage.setItem(SLEEP_REMINDER_DAYS_KEY, JSON.stringify(days));
    
    if (notificationId) {
      await AsyncStorage.setItem(SLEEP_REMINDER_ID_KEY, notificationId);
    }
  } catch (error) {
    console.error('Error saving sleep reminder settings:', error);
  }
};

/**
 * Get sleep reminder settings from AsyncStorage
 * @returns {Promise<Object>} The reminder settings
 */
export const getSleepReminderSettings = async () => {
  try {
    const enabledStr = await AsyncStorage.getItem(SLEEP_REMINDER_ENABLED_KEY);
    const time = await AsyncStorage.getItem(SLEEP_REMINDER_TIME_KEY);
    const daysStr = await AsyncStorage.getItem(SLEEP_REMINDER_DAYS_KEY);
    const notificationId = await AsyncStorage.getItem(SLEEP_REMINDER_ID_KEY);

    return {
      enabled: enabledStr ? JSON.parse(enabledStr) : false,
      time: time || '22:00',
      days: daysStr ? JSON.parse(daysStr) : [0, 1, 2, 3, 4, 5, 6], // Default to every day
      notificationId,
    };
  } catch (error) {
    console.error('Error getting sleep reminder settings:', error);
    return {
      enabled: false,
      time: '22:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      notificationId: null,
    };
  }
};

/**
 * Schedule a sleep reminder for specific days of the week
 * @param {string} time Time in format "HH:MM"
 * @param {Array<number>} days Array of days (0-6, where 0 is Sunday)
 * @returns {Promise<string>} ID of the scheduled notification
 */
export const scheduleSleepReminder = async (time, days) => {
  console.log('=== SCHEDULING SLEEP REMINDER ===');
  console.log('Time:', time);
  console.log('Days:', days);
  
  // Check if running in Expo Go
  if (isRunningInExpoGo()) {
    console.warn('⚠️ WARNING: You are running in Expo Go. Scheduled notifications may not work properly in Expo Go. Consider using a development build for full notification functionality.');
  }
  
  await initializeNotifications();
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission) {
    console.log('❌ No notification permission granted');
    return null;
  }
  
  console.log('✅ Notification permission granted');

  // Cancel any existing reminders first
  const settings = await getSleepReminderSettings();
  if (settings.notificationId) {
    console.log('Cancelling existing notification:', settings.notificationId);
    await cancelSleepReminder(settings.notificationId);
  }

  // Parse the time
  const [hours, minutes] = time.split(':').map(Number);
  console.log('Parsed time - Hours:', hours, 'Minutes:', minutes);
  
  // Convert days from 0-6 (Sunday=0) to 1-7 (Sunday=1) format for expo-notifications
  const convertedDays = days.map(day => day === 0 ? 7 : day);
  console.log('Converted days (1-7 format):', convertedDays);
  
  let trigger;
  
  if (days.length === 7) {
    // Daily notification
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
      repeats: true,
    };
    console.log('📅 Creating DAILY trigger');
  } else {
    // Weekly notification for specific days
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: convertedDays.length === 1 ? convertedDays[0] : convertedDays,
      hour: hours,
      minute: minutes,
      repeats: true,
    };
    console.log('📅 Creating WEEKLY trigger for days:', convertedDays);
  }
  
  console.log('Final trigger configuration:', JSON.stringify(trigger, null, 2));
  
  try {
    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Sleep Reminder",
        body: "It's time to prepare for sleep. Good night!",
        sound: 'notification_sound', // Remove .wav extension for Android compatibility
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: "#0D47A1",
      },
      trigger: trigger,
    });
    
    console.log('✅ Notification scheduled successfully with ID:', notificationId);
    
    // Try to get the next trigger date
    try {
      const nextTriggerDate = await Notifications.getNextTriggerDateAsync(trigger);
      console.log('📅 Next trigger date:', nextTriggerDate);
    } catch (triggerError) {
      console.log('⚠️ Could not calculate next trigger date:', triggerError.message);
    }
    
    // Save the notification ID
     await saveSleepReminderSettings(true, time, days, notificationId);
     
     return notificationId;
   } catch (error) {
     console.error('❌ Error scheduling notification:', error);
     throw error;
   }
 };

/**
 * Schedule a one-time sleep reminder
 * @param {string} time Time in format "HH:MM"
 * @returns {Promise<string>} ID of the scheduled notification
 */
export const scheduleOneTimeSleepReminder = async (time) => {
  await initializeNotifications();
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission) {
    return null;
  }

  // Parse the time
  const [hours, minutes] = time.split(':').map(Number);
  
  // Get the current date and set the time
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // If the time is in the past, schedule for tomorrow
  if (date < new Date()) {
    date.setDate(date.getDate() + 1);
  }
  
  // Schedule the notification
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Sleep Reminder",
      body: "It's time to prepare for sleep. Good night!",
      sound: 'notification_sound', // Remove .wav extension for Android compatibility
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: "#0D47A1",
    },
    trigger: date,
  });
  
  return notificationId;
};

/**
 * Cancel a scheduled sleep reminder
 * @param {string} notificationId ID of the notification to cancel
 */
export const cancelSleepReminder = async (notificationId) => {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
};

/**
 * Cancel all scheduled sleep reminders
 */
export const cancelAllSleepReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await saveSleepReminderSettings(false, '22:00', [0, 1, 2, 3, 4, 5, 6], null);
};

/**
 * Check if sleep reminders are enabled
 * @returns {Promise<boolean>} Whether reminders are enabled
 */
export const areSleepRemindersEnabled = async () => {
  const settings = await getSleepReminderSettings();
  return settings.enabled;
};

/**
 * Get all scheduled notifications
 * @returns {Promise<Array>} Array of scheduled notifications
 */
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * Send a test notification immediately
 */
export const sendTestNotification = async () => {
  await initializeNotifications();
  const hasPermission = await requestNotificationPermissions();
  
  if (!hasPermission) {
    console.log('No notification permission for test');
    return null;
  }
  
  console.log('Sending test notification...');
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Sleep Reminder",
      body: "This is a test notification for sleep reminders.",
      sound: 'notification_sound', // Remove .wav extension for Android compatibility
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: "#0D47A1",
    },
    trigger: null, // Send immediately
  });
};

/**
 * Debug function to check scheduled notifications
 */
export const debugScheduledNotifications = async () => {
  const notifications = await getScheduledNotifications();
  console.log('=== SCHEDULED NOTIFICATIONS DEBUG ===');
  console.log('Total scheduled notifications:', notifications.length);
  
  notifications.forEach((notification, index) => {
    console.log(`Notification ${index + 1}:`);
    console.log('  ID:', notification.identifier);
    console.log('  Title:', notification.content.title);
    console.log('  Trigger:', JSON.stringify(notification.trigger, null, 2));
    
    if (notification.trigger && notification.trigger.type) {
      console.log('  Trigger Type:', notification.trigger.type);
    }
    
    // Calculate next trigger date if possible
    try {
      Notifications.getNextTriggerDateAsync(notification.trigger).then(date => {
        console.log('  Next trigger date:', date);
      }).catch(err => {
        console.log('  Could not calculate next trigger date:', err.message);
      });
    } catch (error) {
      console.log('  Error getting next trigger date:', error.message);
    }
    console.log('---');
  });
  
  return notifications;
};

/**
 * Check if the app is running in Expo Go
 */
export const isRunningInExpoGo = () => {
  return __DEV__ && typeof expo !== 'undefined';
};