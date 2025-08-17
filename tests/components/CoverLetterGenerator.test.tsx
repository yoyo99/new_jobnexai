/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, beforeEach, afterEach, jest } from '@jest/globals';

// Mock dependencies before importing the component
jest.mock('@/stores/auth', () => ({
    useAuth: jest.fn(() => ({ user: null, session: null, loading: true })),
}));

jest.mock('@/lib/supabase', () => ({
    getUserCVs: jest.fn((_userId: string) => Promise.resolve([])),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    }),
  }));

// Import the component and mocked functions
import CoverLetterGenerator from '@/components/CoverLetterGenerator';
import { useAuth } from '@/stores/auth';
import { getUserCVs, CVMetadata } from '@/lib/supabase';

// Type assertion for mocks
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedGetUserCVs = getUserCVs as jest.MockedFunction<typeof getUserCVs>;

const mockCVs: CVMetadata[] = [
    {
        id: 'cv1',
        user_id: 'user-123',
        file_name: 'CV_Primaire.pdf',
        storage_path: 'user-123/cv1.pdf',
        is_primary: true,
        uploaded_at: new Date().toISOString(),
    },
    {
        id: 'cv2',
        user_id: 'user-123',
        file_name: 'CV_Secondaire.pdf',
        storage_path: 'user-123/cv2.pdf',
        is_primary: false,
        uploaded_at: new Date().toISOString(),
    },
];

describe('CoverLetterGenerator', () => {
    beforeEach(() => {
        // Provide a default mock implementation for useAuth
        mockedUseAuth.mockReturnValue({
            user: { id: 'user-123' },
            session: { access_token: 'fake-token' },
            loading: false,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('devrait afficher le formulaire et charger les CVs avec succès', async () => {
        mockedGetUserCVs.mockResolvedValue(mockCVs);

        render(<CoverLetterGenerator />);

        // Check for form fields
        expect(screen.getByLabelText('coverLetterGenerator.labels.jobTitle')).toBeInTheDocument();
        expect(screen.getByLabelText('coverLetterGenerator.labels.companyName')).toBeInTheDocument();

        // Wait for CVs to be loaded and displayed in the select
        await waitFor(() => {
            expect(screen.getByText(/CV_Primaire.pdf/)).toBeInTheDocument();
        });
        
        const cvSelect = screen.getByLabelText('coverLetterGenerator.labels.cv') as HTMLSelectElement;
        expect(cvSelect.value).toBe('cv1'); // Primary CV should be selected
        expect(mockedGetUserCVs).toHaveBeenCalledTimes(1);
    });

        test('devrait afficher un message d\'erreur si le chargement des CVs échoue', async () => {
        const errorMessage = 'Failed to load CVs';
        mockedGetUserCVs.mockRejectedValue(new Error(errorMessage));

        render(<CoverLetterGenerator />);

        // The feedback alert should appear with the error message
        const alert = await screen.findByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(errorMessage);
        expect(mockedGetUserCVs).toHaveBeenCalledTimes(1);
    });
});
