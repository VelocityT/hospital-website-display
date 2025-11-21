import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

const hospitalSlice = createSlice({
  name: "hospital",
  initialState,
  reducers: {
    setHospital(state, action) {
      return action.payload;
    },
    removeHospital() {
      return null;
    },
  },
});

export const { setHospital, removeHospital } = hospitalSlice.actions;
export default hospitalSlice.reducer;
