// src/api/enrollments.ts
import { apiClient } from '../services/api';
import { EnrollmentPayload, EnrollmentResponse } from '../types/enrollment';
import { API_ENDPOINTS } from '../types/api.contract';

export const enrollmentsApi = {
  // GET /v1/enrollments/my-enrollments - طلبات وتسجيلات المستخدم الحالي (الأحدث أولاً)
  getMyEnrollments: async (): Promise<EnrollmentResponse[]> => {
    const response = await apiClient.get<EnrollmentResponse[]>(API_ENDPOINTS.myEnrollments);
    return response.data;
  },

  // POST /v1/enrollments/:programId
  enrollInProgram: async (
    programId: string,
    payload: EnrollmentPayload
  ): Promise<EnrollmentResponse> => {
    const formData = new FormData();

    formData.append('fullNameEn', payload.fullNameEn.trim());
    formData.append('fullNameAr', payload.fullNameAr.trim());
    formData.append('age', String(payload.age));
    formData.append('phoneWhatsApp', payload.phoneWhatsApp.trim());
    formData.append('nationalId', payload.nationalId.trim());
    formData.append('governorate', payload.governorate);

    // إضافة الإيصال إذا تم اختياره
    if (payload.receiptUri) {
      const filename = payload.receiptName || payload.receiptUri.split('/').pop() || 'receipt.jpg';
      const type = payload.receiptMimeType || 'image/jpeg';

      formData.append('receipt', {
        uri: payload.receiptUri,
        name: filename,
        type,
      } as any);
    }

    const response = await apiClient.post<EnrollmentResponse>(
      API_ENDPOINTS.enroll(programId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // A receipt can be up to 10 MB; the default 10 s timeout fails it on slow connections.
        timeout: 60000,
      }
    );

    return response.data;
  },
};