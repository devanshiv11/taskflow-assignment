import api from "./api";

export const getTasks = (boardId, status, page = 1, limit = 10) => {
  const params = new URLSearchParams({ board: boardId, page, limit });
  if (status) params.append("status", status);
  return api.get(`/tasks?${params}`);
};
export const createTask = (data) => api.post("/tasks", data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const searchTasks = (q, filters = {}) => {
  const params = new URLSearchParams({ q, ...filters });
  return api.get(`/tasks/search?${params}`);
};