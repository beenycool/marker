'use client';

import React, { ReactNode, createContext, useContext, useState, useCallback } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';

interface JoyrideContextType {
  isRunning: boolean;
  startTour: (steps: Step[]) => void;
  stopTour: () => void;
  addSteps: (steps: Step[]) => void;
}

const JoyrideContext = createContext<JoyrideContextType | undefined>(undefined);

interface JoyrideProviderProps {
  children: ReactNode;
}

export function JoyrideProvider({ children }: JoyrideProviderProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const startTour = useCallback((newSteps: Step[]) => {
    setSteps(newSteps);
    setIsRunning(true);
  }, []);

  const stopTour = useCallback(() => {
    setIsRunning(false);
    setSteps([]);
  }, []);

  const addSteps = useCallback((newSteps: Step[]) => {
    setSteps(prevSteps => [...prevSteps, ...newSteps]);
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setIsRunning(false);
    }
    
    if (type === EVENTS.TOUR_END) {
      setSteps([]);
    }
  };

  return (
    <JoyrideContext.Provider 
      value={{ 
        isRunning, 
        startTour, 
        stopTour, 
        addSteps 
      }}
    >
      {children}
      <Joyride
        steps={steps}
        run={isRunning}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#000',
          }
        }}
      />
    </JoyrideContext.Provider>
  );
}

export function useJoyride() {
  const context = useContext(JoyrideContext);
  if (context === undefined) {
    throw new Error('useJoyride must be used within a JoyrideProvider');
  }
  return context;
}
