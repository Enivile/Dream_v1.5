import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Battery from 'expo-battery';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// Storage keys
const BATTERY_WARNING_ENABLED_KEY = 'batteryWarningEnabled';
const BATTERY_WARNING_THRESHOLD_KEY = 'batteryWarningThreshold';
const LAST_WARNING_TIME_KEY = 'lastBatteryWarningTime';

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let batteryLevelSubscription = null;
let isMonitoring = false;

/**
 * Initialize notification permissions and channels
 */
export const initializeNotifications = async () => {
  try {
    // Request notification permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('battery-warning', {
        name: 'Battery Warning',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

/**
 * Check if battery warning is enabled
 */
export const isWarningEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(BATTERY_WARNING_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking if warning is enabled:', error);
    return false;
  }
};

/**
 * Get the current warning threshold
 */
export const getWarningThreshold = async () => {
  try {
    const threshold = await AsyncStorage.getItem(BATTERY_WARNING_THRESHOLD_KEY);
    return threshold ? parseInt(threshold, 10) : 20; // Default to 20%
  } catch (error) {
    console.error('Error getting warning threshold:', error);
    return 20;
  }
};

/**
 * Set the warning threshold
 */
export const setWarningThreshold = async (threshold) => {
  try {
    await AsyncStorage.setItem(BATTERY_WARNING_THRESHOLD_KEY, threshold.toString());
    return true;
  } catch (error) {
    console.error('Error setting warning threshold:', error);
    return false;
  }
};

/**
 * Enable battery warning with specified threshold
 */
export const enableWarning = async (threshold = 20) => {
  try {
    await AsyncStorage.setItem(BATTERY_WARNING_ENABLED_KEY, 'true');
    await setWarningThreshold(threshold);
    await startBatteryMonitoring();
    return true;
  } catch (error) {
    console.error('Error enabling battery warning:', error);
    return false;
  }
};

/**
 * Disable battery warning
 */
export const disableWarning = async () => {
  try {
    await AsyncStorage.setItem(BATTERY_WARNING_ENABLED_KEY, 'false');
    await stopBatteryMonitoring();
    return true;
  } catch (error) {
    console.error('Error disabling battery warning:', error);
    return false;
  }
};

/**
 * Start monitoring battery level
 */
export const startBatteryMonitoring = async () => {
  try {
    // Stop existing monitoring if any
    await stopBatteryMonitoring();

    // Check if warning is enabled
    const enabled = await isWarningEnabled();
    if (!enabled) {
      console.log('Battery warning is disabled, not starting monitoring');
      return;
    }

    console.log('Starting battery monitoring...');
    isMonitoring = true;

    // Subscribe to battery level changes
    batteryLevelSubscription = Battery.addBatteryLevelListener(async ({ batteryLevel }) => {
      if (!isMonitoring) return;

      const currentLevel = Math.round(batteryLevel * 100);
      const threshold = await getWarningThreshold();
      
      console.log(`Battery level: ${currentLevel}%, Threshold: ${threshold}%`);

      // Check if we should show warning
      if (currentLevel <= threshold) {
        await handleLowBattery(currentLevel, threshold);
      }
    });

    // Also check current battery level immediately
    const currentBatteryLevel = await Battery.getBatteryLevelAsync();
    const currentLevel = Math.round(currentBatteryLevel * 100);
    const threshold = await getWarningThreshold();
    
    if (currentLevel <= threshold) {
      await handleLowBattery(currentLevel, threshold);
    }

    console.log('Battery monitoring started successfully');
  } catch (error) {
    console.error('Error starting battery monitoring:', error);
    isMonitoring = false;
  }
};

/**
 * Stop monitoring battery level
 */
export const stopBatteryMonitoring = async () => {
  try {
    console.log('Stopping battery monitoring...');
    isMonitoring = false;

    if (batteryLevelSubscription) {
      batteryLevelSubscription.remove();
      batteryLevelSubscription = null;
    }

    console.log('Battery monitoring stopped');
  } catch (error) {
    console.error('Error stopping battery monitoring:', error);
  }
};

/**
 * Handle low battery situation
 */
const handleLowBattery = async (currentLevel, threshold) => {
  try {
    // Check if we recently sent a warning to avoid spam
    const lastWarningTime = await AsyncStorage.getItem(LAST_WARNING_TIME_KEY);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (lastWarningTime && (now - parseInt(lastWarningTime, 10)) < fiveMinutes) {
      console.log('Warning already sent recently, skipping...');
      return;
    }

    // Send notification
    await sendBatteryWarningNotification(currentLevel, threshold);

    // Update last warning time
    await AsyncStorage.setItem(LAST_WARNING_TIME_KEY, now.toString());

    console.log(`Battery warning sent for ${currentLevel}% (threshold: ${threshold}%)`);
  } catch (error) {
    console.error('Error handling low battery:', error);
  }
};

/**
 * Send battery warning notification
 */
const sendBatteryWarningNotification = async (currentLevel, threshold) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔋 Low Battery Warning',
        body: `Your battery is at ${currentLevel}%. Consider charging your device.`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'battery-warning',
      },
      trigger: null, // Send immediately
    });

    return true;
  } catch (error) {
    console.error('Error sending battery warning notification:', error);
    return false;
  }
};

/**
 * Send a test notification
 */
export const sendTestNotification = async () => {
  try {
    const currentBatteryLevel = await Battery.getBatteryLevelAsync();
    const currentLevel = Math.round(currentBatteryLevel * 100);
    const threshold = await getWarningThreshold();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔋 Battery Warning Test',
        body: `Test notification! Current battery: ${currentLevel}%. Warning threshold: ${threshold}%.`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'battery-warning',
      },
      trigger: null, // Send immediately
    });

    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

/**
 * Get current battery warning status
 */
export const getBatteryWarningStatus = async () => {
  try {
    const enabled = await isWarningEnabled();
    const threshold = await getWarningThreshold();
    const currentBatteryLevel = await Battery.getBatteryLevelAsync();
    const currentLevel = Math.round(currentBatteryLevel * 100);

    return {
      enabled,
      threshold,
      currentLevel,
      isMonitoring,
    };
  } catch (error) {
    console.error('Error getting battery warning status:', error);
    return {
      enabled: false,
      threshold: 20,
      currentLevel: null,
      isMonitoring: false,
    };
  }
};

/**
 * Initialize battery warning service
 * Call this when the app starts
 */
export const initializeBatteryWarning = async () => {
  try {
    console.log('Initializing battery warning service...');
    
    // Initialize notifications
    const notificationsInitialized = await initializeNotifications();
    if (!notificationsInitialized) {
      console.warn('Failed to initialize notifications for battery warning');
      return false;
    }

    // Start monitoring if enabled
    const enabled = await isWarningEnabled();
    if (enabled) {
      await startBatteryMonitoring();
      console.log('Battery warning service initialized and monitoring started');
    } else {
      console.log('Battery warning service initialized but monitoring is disabled');
    }

    return true;
  } catch (error) {
    console.error('Error initializing battery warning service:', error);
    return false;
  }
};

/**
 * Clean up battery warning service
 * Call this when the app is closing or component unmounts
 */
export const cleanupBatteryWarning = async () => {
  try {
    await stopBatteryMonitoring();
    console.log('Battery warning service cleaned up');
  } catch (error) {
    console.error('Error cleaning up battery warning service:', error);
  }
};