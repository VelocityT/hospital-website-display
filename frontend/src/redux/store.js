import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import hospitalReducer from "./hospitalSlice";

const EXPIRY_DURATION = 24 * 60 * 60 * 1000;

const loadState = () => {
  try {
    const raw = localStorage.getItem("reduxState");
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);

    const now = Date.now();
    if (!parsed._persistedAt || now - parsed._persistedAt > EXPIRY_DURATION) {
      localStorage.removeItem("reduxState");
      return undefined;
    }

    return parsed.state;
  } catch (err) {
    // console.warn("Could not load Redux state:", err);
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const wrapped = {
      state,
      _persistedAt: Date.now(),
    };
    localStorage.setItem("reduxState", JSON.stringify(wrapped));
  } catch (err) {
    // console.warn("Could not save Redux state:", err);
  }
};

export const store = configureStore({
  reducer: {
    user: userReducer,
    hospital: hospitalReducer,
  },
  preloadedState: loadState(),
});

store.subscribe(() => {
  saveState({
    user: store.getState().user,
    hospital: store.getState().hospital,
  });
});
