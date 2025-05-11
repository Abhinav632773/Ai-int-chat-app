import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;
let bootPromise = null;

export const getWebContainer = async () => {
  // Return existing instance if available
  if (webContainerInstance) {
    return webContainerInstance;
  }

  // If already booting, return the pending promise
  if (bootPromise) {
    return bootPromise;
  }

  try {
    console.log('Starting WebContainer boot...');
    bootPromise = WebContainer.boot();
    webContainerInstance = await bootPromise;
    console.log('WebContainer successfully booted!');
    return webContainerInstance;
  } catch (error) {
    console.error('Failed to boot WebContainer:', error);
    // Reset state on failure
    webContainerInstance = null;
    bootPromise = null;
    throw error;
  }
};

export const cleanupWebContainer = async () => {
  if (webContainerInstance) {
    try {
      console.log('Cleaning up WebContainer...');
      await webContainerInstance.teardown();
    } catch (error) {
      console.error('Error during teardown:', error);
    } finally {
      webContainerInstance = null;
      bootPromise = null;
    }
  }
};

export const isWebContainerReady = () => {
  return webContainerInstance !== null;
};