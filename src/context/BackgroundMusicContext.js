import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

const BackgroundMusicContext = createContext();

export const useBackgroundMusic = () => useContext(BackgroundMusicContext);

export const BackgroundMusicProvider = ({ children }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Load and play background music
  const playBackgroundMusic = async () => {
    try {
      // Unload any existing sound first
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Load the sound file
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/music/Survey_Background_music.mp3'),
        { isLooping: true, shouldPlay: true, volume: 0.4 } // Adjust volume as needed
      );
      
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  };
  
  // Stop background music
  const stopBackgroundMusic = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error stopping background music:', error);
      }
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);
  
  return (
    <BackgroundMusicContext.Provider
      value={{
        playBackgroundMusic,
        stopBackgroundMusic,
        isPlaying
      }}
    >
      {children}
    </BackgroundMusicContext.Provider>
  );
};