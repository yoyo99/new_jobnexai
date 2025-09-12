import { vi } from 'vitest'
import { optimizeCV } from '../ai'
import { supabase } from '../supabase'

vi.mock('../supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('AI Functions', () => {
  const mockCV = {
    education: [
      {
        title: 'Master en Informatique',
        school: 'Université de Paris',
        year: 2020,
      },
    ],
    experience: [
      {
        title: 'Développeur Full Stack',
        company: 'Tech Corp',
        duration: '2020-2023',
      },
    ],
  }

  const mockJobDescription = 'Nous recherchons un développeur React expérimenté...'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('optimizes CV successfully', async () => {
    const mockResponse = {
      suggestions: 'Mettez en avant vos compétences React...',
      keywords: ['React', 'TypeScript', 'Node.js'],
    }

    ;(supabase.functions.invoke as any).mockResolvedValue({
      data: mockResponse,
      error: null,
    })

    const result = await optimizeCV(mockCV, mockJobDescription)

    expect(result).toEqual(mockResponse)
    expect(supabase.functions.invoke).toHaveBeenCalledWith('optimize-cv', {
      body: { cv: mockCV, jobDescription: mockJobDescription },
    })
  })

  test('handles optimization error', async () => {
    const error = new Error('Failed to optimize CV')
    ;(supabase.functions.invoke as any).mockRejectedValue(error)

    await expect(optimizeCV(mockCV, mockJobDescription)).rejects.toThrow('Failed to optimize CV')
  })
})