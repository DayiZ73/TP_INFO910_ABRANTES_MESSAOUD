import axios from 'axios';
import type { AnalysisResult, Group } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

export const analyzeWatchlists = async (users: string[]): Promise<AnalysisResult> => {
  const response = await api.post<AnalysisResult>('/analyze', { users });
  return response.data;
};

export const getGroups = async (): Promise<Group[]> => {
  const response = await api.get<Group[]>('/groups');
  return response.data;
};

export const createGroup = async (name: string, users: string[]): Promise<Group> => {
  const response = await api.post<Group>('/groups', { name, users });
  return response.data;
};

export const getGroup = async (id: string): Promise<Group> => {
  const response = await api.get<Group>(`/groups/${id}`);
  return response.data;
};

export const deleteGroup = async (id: string): Promise<void> => {
  await api.delete(`/groups/${id}`);
};

export const analyzeGroup = async (id: string): Promise<AnalysisResult> => {
  const response = await api.post<AnalysisResult>(`/groups/${id}/analyze`);
  return response.data;
};

export const validateUser = async (username: string): Promise<{ exists: boolean; username: string; displayName?: string }> => {
  const response = await api.get(`/users/${username}/validate`);
  return response.data;
};
