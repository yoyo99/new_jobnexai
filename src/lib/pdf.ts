import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { JobApplication } from './supabase'

// Initialize pdfMake with fonts
if (pdfFonts.pdfMake) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs
} else {
  pdfMake.vfs = pdfFonts
}

pdfMake.fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
}

interface ApplicationPDFOptions {
  includeNotes?: boolean
  includeTimeline?: boolean
}

export async function generateApplicationPDF(application: JobApplication, options: ApplicationPDFOptions = {}) {
  const { includeNotes = true, includeTimeline = true } = options

  const docDefinition = {
    content: [
      {
        text: 'Détails de la candidature',
        style: 'header',
      },
      {
        text: [
          { text: 'Poste : ', bold: true },
          application.job.title,
        ],
        margin: [0, 10, 0, 5],
      },
      {
        text: [
          { text: 'Entreprise : ', bold: true },
          application.job.company,
        ],
        margin: [0, 0, 0, 5],
      },
      {
        text: [
          { text: 'Localisation : ', bold: true },
          application.job.location,
        ],
        margin: [0, 0, 0, 5],
      },
      {
        text: [
          { text: 'Statut : ', bold: true },
          application.status,
        ],
        margin: [0, 0, 0, 5],
      },
      {
        text: [
          { text: 'Date de candidature : ', bold: true },
          format(new Date(application.created_at), 'dd MMMM yyyy', { locale: fr }),
        ],
        margin: [0, 0, 0, 20],
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
      },
    },
    defaultStyle: {
      font: 'Helvetica',
    },
  }

  if (includeNotes && application.notes) {
    docDefinition.content.push(
      { text: 'Notes', style: 'subheader' },
      { text: [application.notes], margin: [0, 0, 0, 20] }
    )
  }

  if (includeTimeline && application.timeline) {
    docDefinition.content.push(
      { text: 'Historique', style: 'subheader' },
      {
        // Historique sous forme de liste à puces
        text: application.timeline.map(event =>
          `• ${format(new Date(event.date), 'dd/MM/yyyy', { locale: fr })} - ${event.description}`
        ),
        margin: [0, 0, 0, 20],
      }
    )
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition)
      pdfDoc.getBlob((blob) => {
        resolve(blob)
      })
    } catch (error) {
      reject(error)
    }
  })
}

export async function downloadApplicationPDF(application: JobApplication, options?: ApplicationPDFOptions) {
  const blob = await generateApplicationPDF(application, options)
  const url = URL.createObjectURL(blob as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `candidature-${application.job.company}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}