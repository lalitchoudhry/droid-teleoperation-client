import React, { createContext, useContext, useReducer } from "react";

const StreamContext = createContext();

const initialState = {
  streams: new Map(),
  settings: {
    resolution: {
      width: 1280,
      height: 720,
    },
    frameRate: 30,
    quality: 0.8,
  },
  errors: new Map(),
};

const ACTIONS = {
  ADD_STREAM: "ADD_STREAM",
  REMOVE_STREAM: "REMOVE_STREAM",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
};

function streamReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_STREAM:
      const newStreams = new Map(state.streams);
      newStreams.set(action.streamId, action.stream);
      return {
        ...state,
        streams: newStreams,
      };

    case ACTIONS.REMOVE_STREAM:
      const updatedStreams = new Map(state.streams);
      updatedStreams.delete(action.streamId);
      return {
        ...state,
        streams: updatedStreams,
      };

    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings,
        },
      };

    case ACTIONS.SET_ERROR:
      const newErrors = new Map(state.errors);
      newErrors.set(action.streamId, action.error);
      return {
        ...state,
        errors: newErrors,
      };

    case ACTIONS.CLEAR_ERROR:
      const updatedErrors = new Map(state.errors);
      updatedErrors.delete(action.streamId);
      return {
        ...state,
        errors: updatedErrors,
      };

    default:
      return state;
  }
}

export function StreamProvider({ children }) {
  const [state, dispatch] = useReducer(streamReducer, initialState);

  const actions = {
    addStream: (streamId, stream) => {
      dispatch({ type: ACTIONS.ADD_STREAM, streamId, stream });
    },
    removeStream: (streamId) => {
      dispatch({ type: ACTIONS.REMOVE_STREAM, streamId });
    },
    updateSettings: (settings) => {
      dispatch({ type: ACTIONS.UPDATE_SETTINGS, settings });
    },
    setError: (streamId, error) => {
      dispatch({ type: ACTIONS.SET_ERROR, streamId, error });
    },
    clearError: (streamId) => {
      dispatch({ type: ACTIONS.CLEAR_ERROR, streamId });
    },
  };

  return (
    <StreamContext.Provider value={{ state, actions }}>
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("useStream must be used within a StreamProvider");
  }
  return context;
}

export { ACTIONS };
