// src/api/programs.ts
import { apiClient } from '../services/api';
import { API_ENDPOINTS } from '../types/api.contract';
import { Program, ProgramDetail } from '../types/lms';

export const programsApi = {
  // GET /v1/programs - جلب كافة البرامج المتاحة (المنشورة والجارية)
  getAllPrograms: async (): Promise<Program[]> => {
    const response = await apiClient.get<Program[]>(API_ENDPOINTS.programs);
    return response.data;
  },

  // GET /programs/:id - جلب تفاصيل برنامج محدد بما فيه المسارات والموديولات
  // getProgramById: async (id: string): Promise<Program> => {
  //   const response = await apiClient.get<Program>(`/programs/${id}`);
  //   console.log(response, 'dddddddddddddddddddd');

  //   return response.data;
  // },

  // GET /v1/programs/:slug - تفاصيل البرنامج مع طلب تسجيل المستخدم الحالي (myEnrollment)
  getProgramBySlug: async (slug: string): Promise<ProgramDetail> => {
    const response = await apiClient.get<ProgramDetail>(API_ENDPOINTS.program(slug));
    return response.data;
  },

  // Assignment submission is not implemented on the backend yet (only GET /v1/assignments[/:id]).
};