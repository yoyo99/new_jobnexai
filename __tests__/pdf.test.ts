import { generateApplicationPDF, downloadApplicationPDF } from '@/lib/pdf'
import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

jest.mock('pdfmake/build/pdfmake', () => ({
  default: {
    vfs: {},
    fonts: {},
    createPdf: jest.fn(),
  },
}))

jest.mock('pdfmake/build/vfs_fonts', () => ({
  pdfMake: {
    vfs: {},
  },
}))

describe('PDF Functions', () => {
  const mockApplication = {
    id: '123',
    job: {
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'Paris',
    },
    status: 'applied',
    notes: 'Test notes',
    created_at: '2024-01-01T00:00:00Z',
    timeline: [
      {
        date: '2024-01-01T00:00:00Z',
        description: 'Application submitted',
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(pdfMake.createPdf as any).mockReturnValue({
      getBlob: (callback: (blob: Blob) => void) => callback(new Blob()),
    })
  })

  test('generates PDF successfully', async () => {
    const blob = await generateApplicationPDF(mockApplication)

    expect(pdfMake.createPdf).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.arrayContaining([
        expect.objectContaining({
          text: 'Détails de la candidature',
        }),
      ]),
    }))

    expect(blob).toBeInstanceOf(Blob)
  })

  test('handles PDF generation error', async () => {
    const error = new Error('PDF generation failed')
    ;(pdfMake.createPdf as any).mockReturnValue({
      getBlob: () => {
        throw error
      },
    })

    await expect(generateApplicationPDF(mockApplication)).rejects.toThrow('PDF generation failed')
  })

  test('downloads PDF', async () => {
    const createElementSpy = jest.spyOn(document, 'createElement')
    const appendChildSpy = jest.spyOn(document.body, 'appendChild')
    const removeChildSpy = jest.spyOn(document.body, 'removeChild')
    const clickSpy = jest.fn()

    createElementSpy.mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any)

    await downloadApplicationPDF(mockApplication)

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})