import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import alertsReducer from './slices/alertsSlice';
import eventsReducer from './slices/eventsSlice';
import helpReducer from './slices/helpSlice';
import mapReducer from './slices/mapSlice';
import uiReducer from './slices/uiSlice';
import friendsReducer from './slices/friendsSlice';
import livestreamsReducer from './slices/livestreamsSlice';
import moderationReducer from './slices/moderationSlice';
import notificationsReducer from './slices/notificationsSlice';
import messagesReducer from './slices/messagesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    alerts: alertsReducer,
    events: eventsReducer,
    help: helpReducer,
    map: mapReducer,
    ui: uiReducer,
  friends: friendsReducer,
    livestreams: livestreamsReducer,
    moderation: moderationReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store; 