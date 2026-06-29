import api from "./api";

export const getActivity = (boardId) => api.get(`/activity?board=${boardId}`);
