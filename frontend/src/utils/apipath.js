const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_PATH = {
  AUTH: {
    LOGIN: `${BASE_URL}/api/v1/auth/login`,
    REGISTER: `${BASE_URL}/api/v1/auth/register`,
    LOGOUT: `${BASE_URL}/api/v1/auth/logout`,
    GET_USER: `${BASE_URL}/api/v1/auth/getuser`,
    UPDATE_PROFILE: `${BASE_URL}/api/v1/auth/update-profile`,
    CHANGE_PASSWORD: `${BASE_URL}/api/v1/auth/change-password`,
    CREATE_POLL: `${BASE_URL}/api/v1/auth/create-poll`,
    GET_POLLS: `${BASE_URL}/api/v1/auth/getpolls`,
    GET_USERPOLLS: `${BASE_URL}/api/v1/auth/userpoll`,
    DELETE_POLL: `${BASE_URL}/api/v1/auth/delete-poll`,
    VOTE_POLL: `${BASE_URL}/api/v1/auth/votepoll`,
    GET_VOTED_POLLS: `${BASE_URL}/api/v1/auth/getvotedpolls`,
    BOOKMARK_POLL: `${BASE_URL}/api/v1/auth/bookmarkpoll`,
    GET_BOOOKMARK_POLLS: `${BASE_URL}/api/v1/auth/getbookmarkedpolls`,
    TRENDING_POLLS: `${BASE_URL}/api/v1/auth/trendingpolls`,
    ANALYZE_SENTIMENT: `${BASE_URL}/api/v1/auth/analyze-sentiment`,
  },
  IMAGE: {
    UPLOAD: `${BASE_URL}/api/v1/image/upload-image`,
  },
};